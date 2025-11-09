/**
 * PAXml 2.2 format generator for Fortnox Lön
 * Based on Fortnox PAXml specification
 */

type BuildPAXmlInput = {
  company: { orgNumber: string };
  period: { start: string; end: string };
  employees: Array<any>;
  entries: Array<any>;
};

/**
 * PAXml 2.2 – se Fortnox spec. Koder (OB1, ÖT1 etc.) mappas via rates.ts
 */
export function buildPAXml(input: BuildPAXmlInput): string {
  const header = `<?xml version="1.0" encoding="utf-8"?>\n<PAXml version="2.2">`;
  const period = `<PayPeriod><StartDate>${input.period.start}</StartDate><EndDate>${input.period.end}</EndDate></PayPeriod>`;

  const employeesXml = input.employees.map((e) => {
    const external = (e.external_ids ?? {}) as Record<string, string>;
    const empNo = external.fortnox_id ?? external.visma_id ?? e.id;
    
    const rows = input.entries
      .filter((te) => te.employee_id === e.id)
      .map(te => {
        const hours = Number(te.hours_total ?? 0);
        const code = resolvePAXmlWageCode(te);
        return `<Transaction><EmployeeId>${empNo}</EmployeeId><WageCode>${code}</WageCode><Quantity>${hours.toFixed(2)}</Quantity><TransactionDate>${te.date}</TransactionDate></Transaction>`;
      }).join('');
    
    return `<Employee><EmployeeId>${empNo}</EmployeeId>${rows}</Employee>`;
  }).join('');

  return `${header}${period}<Company><OrgNumber>${input.company.orgNumber}</OrgNumber></Company>${employeesXml}</PAXml>`;
}

/**
 * Resolves PAXml wage code from time entry
 * TODO: Integrate with actual OB/OT mapping from rates.ts
 * Handles missing columns gracefully
 */
function resolvePAXmlWageCode(te: any): string {
  // Overtime codes (ÖT) - check if column exists
  if (te.ot_type !== undefined && te.ot_type !== null) {
    if (te.ot_type === 'ot1') return 'ÖT1'; // 50%
    if (te.ot_type === 'ot2') return 'ÖT2'; // 30%
    if (te.ot_type === 'ot3') return 'ÖT3'; // 70%
    if (te.ot_type === 'ot4') return 'ÖT4'; // 100%
    return 'ÖT1'; // default
  }

  // OB codes (Obekväm arbetstid)
  if (te.ob_type !== undefined && te.ob_type !== null) {
    if (te.ob_type === 'ob1' || te.ob_type === 'evening') return 'OB1'; // 20%
    if (te.ob_type === 'ob2' || te.ob_type === 'late') return 'OB2'; // 40%
    if (te.ob_type === 'ob3' || te.ob_type === 'night' || te.ob_type === 'weekend') return 'OB3'; // 70%
    return 'OB1'; // default
  }

  // Absence codes - check if column exists
  if (te.absence_code !== undefined && te.absence_code !== null) {
    const code = String(te.absence_code).toUpperCase();
    if (code === 'SJK' || code === 'SICK') return 'SJK'; // Sjukdom
    if (code === 'SEM' || code === 'VACATION') return 'SEM'; // Semester
    if (code === 'VAR' || code === 'CHILDCARE') return 'VAR'; // Vård av barn
    return code; // Use as-is if recognized
  }

  // Allowance codes - check if column exists
  if (te.allowance_code !== undefined && te.allowance_code !== null) {
    const code = String(te.allowance_code).toUpperCase();
    if (code === 'UTL' || code === 'TRAVEL') return 'UTL'; // Utlägg
    if (code === 'BON' || code === 'BONUS') return 'BON'; // Bonus
    return code;
  }

  return 'ARB'; // Normal work (Arbetat)
}

