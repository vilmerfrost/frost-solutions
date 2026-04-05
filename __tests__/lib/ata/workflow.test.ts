import {
  canTransition,
  getNextStatuses,
  validateForReview,
  validateTransition,
} from '@/lib/ata/workflow'

describe('ÄTA Workflow — state machine', () => {
  describe('canTransition', () => {
    it('allows created → admin_reviewed', () => {
      expect(canTransition('created', 'admin_reviewed')).toBe(true)
    })

    it('allows admin_reviewed → approval_sent', () => {
      expect(canTransition('admin_reviewed', 'approval_sent')).toBe(true)
    })

    it('allows approval_sent → customer_approved', () => {
      expect(canTransition('approval_sent', 'customer_approved')).toBe(true)
    })

    it('allows approval_sent → customer_rejected', () => {
      expect(canTransition('approval_sent', 'customer_rejected')).toBe(true)
    })

    it('allows customer_approved → work_completed', () => {
      expect(canTransition('customer_approved', 'work_completed')).toBe(true)
    })

    it('allows work_completed → invoice_generated', () => {
      expect(canTransition('work_completed', 'invoice_generated')).toBe(true)
    })

    it('rejects created → approval_sent (skipping review)', () => {
      expect(canTransition('created', 'approval_sent')).toBe(false)
    })

    it('rejects customer_rejected → work_completed', () => {
      expect(canTransition('customer_rejected', 'work_completed')).toBe(false)
    })

    it('rejects invoice_generated → anything', () => {
      expect(canTransition('invoice_generated', 'created')).toBe(false)
    })

    it('returns false for unknown status', () => {
      expect(canTransition('nonexistent', 'created')).toBe(false)
    })
  })

  describe('getNextStatuses', () => {
    it('returns [admin_reviewed] for created', () => {
      expect(getNextStatuses('created')).toEqual(['admin_reviewed'])
    })

    it('returns [] for terminal states', () => {
      expect(getNextStatuses('invoice_generated')).toEqual([])
      expect(getNextStatuses('customer_rejected')).toEqual([])
    })

    it('returns [] for unknown status', () => {
      expect(getNextStatuses('nonexistent')).toEqual([])
    })
  })

  describe('validateForReview', () => {
    it('requires at least 1 photo for unforeseen ÄTA', () => {
      const result = validateForReview({ ataType: 'unforeseen', photoCount: 0 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('photo')
    })

    it('accepts unforeseen ÄTA with photos', () => {
      const result = validateForReview({ ataType: 'unforeseen', photoCount: 3 })
      expect(result.valid).toBe(true)
    })

    it('does not require photos for foreseen ÄTA', () => {
      const result = validateForReview({ ataType: 'foreseen', photoCount: 0 })
      expect(result.valid).toBe(true)
    })
  })

  describe('validateTransition', () => {
    it('rejects invalid state machine transition', () => {
      const result = validateTransition('created', 'invoice_generated')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid transition')
    })

    it('rejects unforeseen ÄTA review without photos', () => {
      const result = validateTransition('created', 'admin_reviewed', {
        ataType: 'unforeseen',
        photoCount: 0,
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('photo')
    })

    it('accepts valid transition with context', () => {
      const result = validateTransition('created', 'admin_reviewed', {
        ataType: 'foreseen',
        photoCount: 0,
      })
      expect(result.valid).toBe(true)
    })

    it('accepts valid transition without context', () => {
      const result = validateTransition('admin_reviewed', 'approval_sent')
      expect(result.valid).toBe(true)
    })
  })
})
