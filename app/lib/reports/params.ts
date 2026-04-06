export type ReportType = 'profitability' | 'utilization' | 'cashflow'
export type ReportTab = ReportType | 'saved'
export type PeriodMode = 'month' | 'custom'
export type ProfitabilityGroupBy = 'project' | 'client' | 'employee'

interface ReportPeriodInput {
  periodMode: PeriodMode
  period: string
  customFrom: string
  customTo: string
}

interface ProfitabilitySearchParamsInput extends ReportPeriodInput {
  groupBy: ProfitabilityGroupBy
}

interface ReportExportPayloadInput extends ReportPeriodInput {
  activeTab: ReportTab
  groupBy: ProfitabilityGroupBy
}

type ReportExportPayload =
  | {
      reportType: 'profitability'
      format: 'csv'
      groupBy: ProfitabilityGroupBy
      period?: string
      from?: string
      to?: string
    }
  | {
      reportType: 'utilization'
      format: 'csv'
      period?: string
      from?: string
      to?: string
    }
  | {
      reportType: 'cashflow'
      format: 'csv'
      months: number
    }

function hasCustomRange({ periodMode, customFrom, customTo }: ReportPeriodInput) {
  return periodMode === 'custom' && Boolean(customFrom) && Boolean(customTo)
}

export function buildProfitabilitySearchParams(input: ProfitabilitySearchParamsInput): URLSearchParams {
  const params = new URLSearchParams({ groupBy: input.groupBy })

  if (hasCustomRange(input)) {
    params.set('from', input.customFrom)
    params.set('to', input.customTo)
    return params
  }

  params.set('period', input.period)
  return params
}

export function buildReportExportPayload(input: ReportExportPayloadInput): ReportExportPayload | null {
  if (input.activeTab === 'saved') return null

  if (input.activeTab === 'cashflow') {
    return {
      reportType: 'cashflow',
      format: 'csv',
      months: 6,
    }
  }

  const periodPayload = hasCustomRange(input)
    ? { from: input.customFrom, to: input.customTo }
    : { period: input.period }

  if (input.activeTab === 'profitability') {
    return {
      reportType: 'profitability',
      format: 'csv',
      groupBy: input.groupBy,
      ...periodPayload,
    }
  }

  return {
    reportType: 'utilization',
    format: 'csv',
    ...periodPayload,
  }
}
