import { createHash } from 'crypto'
import { computeEventHash } from '@/lib/ata/audit'

describe('computeEventHash', () => {
  const sampleEvent = {
    tenant_id: 'tenant-1',
    ata_id: 'ata-1',
    event_type: 'created',
    actor_id: 'user-1',
    actor_type: 'employee',
    data: { description: 'Test event' },
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
  }
  const timestamp = '2026-01-01T00:00:00.000Z'

  it('produces a valid SHA-256 hex string', () => {
    const hash = computeEventHash(null, sampleEvent, timestamp)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic — same inputs produce same hash', () => {
    const a = computeEventHash(null, sampleEvent, timestamp)
    const b = computeEventHash(null, sampleEvent, timestamp)
    expect(a).toBe(b)
  })

  it('chains correctly — uses previous hash in computation', () => {
    const first = computeEventHash(null, sampleEvent, timestamp)
    const chained = computeEventHash(first, sampleEvent, timestamp)

    // Manually compute the expected chained hash
    const payload = first + JSON.stringify(sampleEvent) + timestamp
    const expected = createHash('sha256').update(payload).digest('hex')

    expect(chained).toBe(expected)
  })

  it('differs when previous hash changes', () => {
    const withNull = computeEventHash(null, sampleEvent, timestamp)
    const withPrev = computeEventHash('abc123', sampleEvent, timestamp)
    expect(withNull).not.toBe(withPrev)
  })

  it('differs when event data changes', () => {
    const original = computeEventHash(null, sampleEvent, timestamp)
    const modified = computeEventHash(
      null,
      { ...sampleEvent, event_type: 'approved' },
      timestamp
    )
    expect(original).not.toBe(modified)
  })

  it('differs when timestamp changes', () => {
    const a = computeEventHash(null, sampleEvent, '2026-01-01T00:00:00.000Z')
    const b = computeEventHash(null, sampleEvent, '2026-01-02T00:00:00.000Z')
    expect(a).not.toBe(b)
  })

  it('produces a valid chain across multiple events', () => {
    const events = [
      { data: { step: 1 }, ts: '2026-01-01T00:00:00.000Z' },
      { data: { step: 2 }, ts: '2026-01-01T01:00:00.000Z' },
      { data: { step: 3 }, ts: '2026-01-01T02:00:00.000Z' },
    ]

    let previousHash: string | null = null
    const hashes: string[] = []

    for (const event of events) {
      const hash = computeEventHash(previousHash, event.data, event.ts)
      hashes.push(hash)
      previousHash = hash
    }

    // All hashes should be unique
    expect(new Set(hashes).size).toBe(3)

    // Verify chain: recompute and confirm
    let verifyPrev: string | null = null
    for (let i = 0; i < events.length; i++) {
      const recomputed = computeEventHash(verifyPrev, events[i].data, events[i].ts)
      expect(recomputed).toBe(hashes[i])
      verifyPrev = recomputed
    }
  })
})
