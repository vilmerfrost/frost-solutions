import { buildProfitabilitySearchParams, buildReportExportPayload } from '@/lib/reports/params'

describe('report params helpers', () => {
  it('uses custom profitability range without leaking the month param', () => {
    const params = buildProfitabilitySearchParams({
      periodMode: 'custom',
      period: '2026-04',
      customFrom: '2026-04-01',
      customTo: '2026-04-30',
      groupBy: 'client',
    })

    expect(params.get('groupBy')).toBe('client')
    expect(params.get('from')).toBe('2026-04-01')
    expect(params.get('to')).toBe('2026-04-30')
    expect(params.has('period')).toBe(false)
  })

  it('falls back to monthly profitability params when no custom range is active', () => {
    const params = buildProfitabilitySearchParams({
      periodMode: 'month',
      period: '2026-04',
      customFrom: '',
      customTo: '',
      groupBy: 'project',
    })

    expect(params.get('period')).toBe('2026-04')
    expect(params.get('groupBy')).toBe('project')
    expect(params.has('from')).toBe(false)
    expect(params.has('to')).toBe(false)
  })

  it('builds profitability export payloads that match the custom range', () => {
    const payload = buildReportExportPayload({
      activeTab: 'profitability',
      periodMode: 'custom',
      period: '2026-04',
      customFrom: '2026-04-10',
      customTo: '2026-04-25',
      groupBy: 'employee',
    })

    expect(payload).toEqual({
      reportType: 'profitability',
      format: 'csv',
      groupBy: 'employee',
      from: '2026-04-10',
      to: '2026-04-25',
    })
  })

  it('returns no export payload for saved reports', () => {
    const payload = buildReportExportPayload({
      activeTab: 'saved',
      periodMode: 'month',
      period: '2026-04',
      customFrom: '',
      customTo: '',
      groupBy: 'project',
    })

    expect(payload).toBeNull()
  })
})
