// ──────────────────────────────────────────────
// Arbetstidslagen (Swedish Working Time Act) compliance checks
// ──────────────────────────────────────────────

export interface ComplianceViolation {
  rule: string
  description: string
  severity: 'warning' | 'error'
}

export interface ComplianceCheck {
  valid: boolean
  violations: ComplianceViolation[]
}

/**
 * Check compliance with Arbetstidslagen (Swedish Working Time Act 1982:673).
 *
 * @param weeklyHours  Total hours worked in the current week
 * @param dailyHours   Total hours worked in the current 24-hour period
 * @param restHoursSinceLast  Consecutive rest hours since last shift ended
 * @param options  Optional — for extended checks
 */
export function checkArbetstidslagen(
  weeklyHours: number,
  dailyHours: number,
  restHoursSinceLast: number,
  options?: {
    /** Overtime hours accumulated this calendar year */
    yearlyOvertimeHours?: number
    /** Consecutive rest hours in the last 7-day period */
    weeklyRestHours?: number
    /** Average weekly hours over the last 4 weeks (including overtime) */
    avgWeeklyHoursOver4Weeks?: number
  }
): ComplianceCheck {
  const violations: ComplianceViolation[] = []

  // Rule 1: Max 40 hours ordinary work per week (5 § Arbetstidslagen)
  if (weeklyHours > 40) {
    violations.push({
      rule: 'MAX_WEEKLY_ORDINARY_HOURS',
      description: `Veckoarbetstiden overskrider 40 timmar (${weeklyHours}h). Ordinarie arbetstid far inte overstiga 40 timmar per helgfri vecka.`,
      severity: weeklyHours > 48 ? 'error' : 'warning',
    })
  }

  // Rule 2: Max 48 hours (including overtime) per week averaged over 4 weeks (8 § + 10 §)
  const avgWeekly = options?.avgWeeklyHoursOver4Weeks
  if (avgWeekly !== undefined && avgWeekly > 48) {
    violations.push({
      rule: 'MAX_WEEKLY_TOTAL_HOURS_AVG',
      description: `Genomsnittlig veckoarbetstid (inkl overtid) overskrider 48 timmar over 4 veckor (${avgWeekly}h). Maxgrans ar 48h/vecka i snitt.`,
      severity: 'error',
    })
  }
  // Also warn if current week alone exceeds 48h
  if (weeklyHours > 48) {
    violations.push({
      rule: 'MAX_WEEKLY_TOTAL_HOURS',
      description: `Veckoarbetstiden (inkl overtid) overskrider 48 timmar denna vecka (${weeklyHours}h).`,
      severity: 'error',
    })
  }

  // Rule 3: Max 200 hours overtime per calendar year (8 § Arbetstidslagen)
  if (options?.yearlyOvertimeHours !== undefined && options.yearlyOvertimeHours > 200) {
    violations.push({
      rule: 'MAX_YEARLY_OVERTIME',
      description: `Overtid overskrider 200 timmar per kalenderAr (${options.yearlyOvertimeHours}h). Maxgrans ar 200 timmar.`,
      severity: 'error',
    })
  }

  // Rule 4: Minimum 11 hours consecutive rest per 24-hour period (13 § Arbetstidslagen)
  if (restHoursSinceLast < 11) {
    violations.push({
      rule: 'MIN_DAILY_REST',
      description: `Dygnsvilan understiger 11 timmar (${restHoursSinceLast}h). Arbetstagare har ratt till minst 11 timmars sammanhangande vila per 24-timmarsperiod.`,
      severity: restHoursSinceLast < 8 ? 'error' : 'warning',
    })
  }

  // Rule 5: Minimum 36 hours consecutive rest per 7-day period (14 § Arbetstidslagen)
  if (options?.weeklyRestHours !== undefined && options.weeklyRestHours < 36) {
    violations.push({
      rule: 'MIN_WEEKLY_REST',
      description: `Veckovilan understiger 36 timmar (${options.weeklyRestHours}h). Arbetstagare har ratt till minst 36 timmars sammanhangande ledighet per sjudagarsperiod.`,
      severity: options.weeklyRestHours < 24 ? 'error' : 'warning',
    })
  }

  // Rule 6: Max daily hours check — no explicit statutory limit, but practical max ~13h
  // (24h minus 11h rest = 13h)
  if (dailyHours > 13) {
    violations.push({
      rule: 'MAX_DAILY_HOURS',
      description: `Daglig arbetstid overskrider 13 timmar (${dailyHours}h). Med krav pa 11 timmars dygnsvila far en arbetsdag inte overstiga 13 timmar.`,
      severity: 'error',
    })
  } else if (dailyHours > 10) {
    violations.push({
      rule: 'HIGH_DAILY_HOURS',
      description: `Daglig arbetstid ar hog (${dailyHours}h). Overvaeg om tillracklig vila kan sakerstallas.`,
      severity: 'warning',
    })
  }

  return {
    valid: violations.filter((v) => v.severity === 'error').length === 0,
    violations,
  }
}
