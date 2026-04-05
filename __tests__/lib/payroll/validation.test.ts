/**
 * @jest-environment node
 */
import { validateForExport } from '@/lib/payroll/validation'
import { createAdminClient } from '@/utils/supabase/admin'

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}))

const TENANT = 'tenant-1'
const PERIOD_ID = 'period-1'

/**
 * Build a chainable Supabase mock where each `.from(table)` call
 * resolves to the data you specify for that table.
 */
function buildSupaMock(tableData: Record<string, { data: any; error: any }>) {
  const chainable = (table: string): any => {
    const result = tableData[table] ?? { data: null, error: null }
    const chain: Record<string, any> = {}
    const methods = ['select', 'eq', 'gte', 'lte', 'order']
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain)
    }
    chain.maybeSingle = jest.fn().mockResolvedValue(result)
    // For queries without maybeSingle (employees, time_entries) the chain
    // itself resolves via .then so it can be awaited directly.
    chain.then = (resolve: any) => resolve(result)
    return chain
  }

  return { from: jest.fn((table: string) => chainable(table)) }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('validateForExport', () => {
  it('returns PERIOD_NOT_FOUND when period query returns null', async () => {
    const mock = buildSupaMock({
      payroll_periods: { data: null, error: null },
    })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const result = await validateForExport(TENANT, PERIOD_ID)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].code).toBe('PERIOD_NOT_FOUND')
    expect(result.errors[0].level).toBe('error')
    expect(result.warnings).toHaveLength(0)
    expect(result.context.employees).toEqual([])
    expect(result.context.entries).toEqual([])
  })

  it('returns PERIOD_NOT_FOUND when period query has an error', async () => {
    const mock = buildSupaMock({
      payroll_periods: { data: null, error: { message: 'db error' } },
    })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const result = await validateForExport(TENANT, PERIOD_ID)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].code).toBe('PERIOD_NOT_FOUND')
  })

  it('returns EMPLOYEE_ID_MISSING warning when external_ids lacks fortnox_id and visma_id', async () => {
    const mock = buildSupaMock({
      payroll_periods: {
        data: { id: PERIOD_ID, start_date: '2026-01-01', end_date: '2026-01-31' },
        error: null,
      },
      employees: {
        data: [
          { id: 'emp-1', external_ids: {} },
          { id: 'emp-2', external_ids: null },
          { id: 'emp-3', external_ids: { fortnox_id: 'F1' } },
        ],
        error: null,
      },
      time_entries: {
        data: [
          { id: 'te-1', employee_id: 'emp-1', hours_total: 8, status: 'approved', ob_type: null, ot_type: null },
        ],
        error: null,
      },
    })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const result = await validateForExport(TENANT, PERIOD_ID)

    const warnings = result.warnings.filter((w) => w.code === 'EMPLOYEE_ID_MISSING')
    expect(warnings).toHaveLength(2)
    expect(warnings[0].level).toBe('warning')
    expect(warnings[0].context?.employeeId).toBe('emp-1')
    expect(warnings[1].context?.employeeId).toBe('emp-2')
  })

  it('returns TIMESHEETS_NOT_APPROVED when entries have non-approved status', async () => {
    const mock = buildSupaMock({
      payroll_periods: {
        data: { id: PERIOD_ID, start_date: '2026-01-01', end_date: '2026-01-31' },
        error: null,
      },
      employees: { data: [], error: null },
      time_entries: {
        data: [
          { id: 'te-1', hours_total: 8, status: 'draft', ob_type: null, ot_type: null },
          { id: 'te-2', hours_total: 4, status: 'submitted', ob_type: null, ot_type: null },
          { id: 'te-3', hours_total: 6, status: 'approved', ob_type: null, ot_type: null },
        ],
        error: null,
      },
    })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const result = await validateForExport(TENANT, PERIOD_ID)

    const err = result.errors.find((e) => e.code === 'TIMESHEETS_NOT_APPROVED')
    expect(err).toBeDefined()
    expect(err!.level).toBe('error')
    expect(err!.message).toContain('2')
  })

  it('returns OB_OT_CONFLICT when a time entry has both ob_type and ot_type', async () => {
    const mock = buildSupaMock({
      payroll_periods: {
        data: { id: PERIOD_ID, start_date: '2026-01-01', end_date: '2026-01-31' },
        error: null,
      },
      employees: { data: [], error: null },
      time_entries: {
        data: [
          { id: 'te-1', hours_total: 8, status: 'approved', ob_type: 'OB1', ot_type: 'OT1' },
          { id: 'te-2', hours_total: 6, status: 'approved', ob_type: null, ot_type: 'OT2' },
        ],
        error: null,
      },
    })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const result = await validateForExport(TENANT, PERIOD_ID)

    const conflicts = result.errors.filter((e) => e.code === 'OB_OT_CONFLICT')
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].context?.timeEntryId).toBe('te-1')
  })

  it('returns INVALID_HOURS when hours_total <= 0 or > 24', async () => {
    const mock = buildSupaMock({
      payroll_periods: {
        data: { id: PERIOD_ID, start_date: '2026-01-01', end_date: '2026-01-31' },
        error: null,
      },
      employees: { data: [], error: null },
      time_entries: {
        data: [
          { id: 'te-zero', hours_total: 0, status: 'approved', ob_type: null, ot_type: null },
          { id: 'te-neg', hours_total: -2, status: 'approved', ob_type: null, ot_type: null },
          { id: 'te-over', hours_total: 25, status: 'approved', ob_type: null, ot_type: null },
          { id: 'te-ok', hours_total: 8, status: 'approved', ob_type: null, ot_type: null },
        ],
        error: null,
      },
    })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const result = await validateForExport(TENANT, PERIOD_ID)

    const invalid = result.errors.filter((e) => e.code === 'INVALID_HOURS')
    expect(invalid).toHaveLength(3)
    const ids = invalid.map((e) => e.context?.timeEntryId)
    expect(ids).toContain('te-zero')
    expect(ids).toContain('te-neg')
    expect(ids).toContain('te-over')
  })

  it('returns no errors or warnings for fully valid data', async () => {
    const mock = buildSupaMock({
      payroll_periods: {
        data: { id: PERIOD_ID, start_date: '2026-01-01', end_date: '2026-01-31' },
        error: null,
      },
      employees: {
        data: [{ id: 'emp-1', external_ids: { fortnox_id: 'F1' } }],
        error: null,
      },
      time_entries: {
        data: [
          { id: 'te-1', hours_total: 8, status: 'approved', ob_type: null, ot_type: null },
        ],
        error: null,
      },
    })
    ;(createAdminClient as jest.Mock).mockReturnValue(mock)

    const result = await validateForExport(TENANT, PERIOD_ID)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
    expect(result.context.employees).toHaveLength(1)
    expect(result.context.entries).toHaveLength(1)
  })
})
