/**
 * Visma Lön CSV format generator
 * Format: Semicolon-separated CSV for Visma Lön 300/600
 */

type BuildVismaCSVInput = {
  period: { start: string; end: string };
  employees: Array<any>;
  entries: Array<any>;
};

/**
 * Visma Lön 300/600 – semikolon-separerad. Kolumner varierar per import – följ guiden.
 */
export function buildVismaCSV(input: BuildVismaCSVInput): string {
  const header = [
    'PersonNr/AnstNr', // extern id
    'Datum',
    'Löneart',
    'Antal',
    'Á-pris',
    'Belopp',
    'Text'
  ].join(';');

  const lines: string[] = [header];

  for (const e of input.employees) {
    const ext = (e.external_ids ?? {}) as Record<string, string>;
    const empNo = ext.visma_id ?? ext.fortnox_id ?? e.id;
    
    const empEntries = input.entries.filter(te => te.employee_id === e.id);
    
    for (const te of empEntries) {
      const wageCode = resolveVismaWageCode(te);
      const qty = Number(te.hours_total ?? 0);
      const unitPrice = ''; // Oftast lämnas tomt, Visma räknar via löneart
      const amount = '';    // Samma här – eller sätt 0
      const text = te.project_id ? `Projekt:${te.project_id}` : '';
      
      lines.push([
        empNo, 
        te.date, 
        wageCode, 
        qty.toFixed(2), 
        unitPrice, 
        amount, 
        text
      ].join(';'));
    }
  }

  return lines.join('\n');
}

/**
 * Resolves Visma wage code from time entry
 * TODO: Integrate with actual OB/OT mapping from rates.ts
 * Handles missing columns gracefully
 */
function resolveVismaWageCode(te: any): string {
  // Overtime codes - check if column exists
  if (te.ot_type !== undefined && te.ot_type !== null) {
    if (te.ot_type === 'ot1') return 'OT1';
    if (te.ot_type === 'ot2') return 'OT2';
    if (te.ot_type === 'ot3') return 'OT3';
    if (te.ot_type === 'ot4') return 'OT4';
    return 'OT1'; // default
  }

  // OB codes
  if (te.ob_type !== undefined && te.ob_type !== null) {
    if (te.ob_type === 'ob1' || te.ob_type === 'evening') return 'OB1';
    if (te.ob_type === 'ob2' || te.ob_type === 'late') return 'OB2';
    if (te.ob_type === 'ob3' || te.ob_type === 'night' || te.ob_type === 'weekend') return 'OB3';
    return 'OB1'; // default
  }

  // Absence codes - check if column exists
  if (te.absence_code !== undefined && te.absence_code !== null) {
    const code = String(te.absence_code).toUpperCase();
    if (code === 'SJK' || code === 'SICK') return 'SJK';
    if (code === 'SEM' || code === 'VACATION') return 'SEM';
    if (code === 'VAR' || code === 'CHILDCARE') return 'VAR';
    return code;
  }

  // Allowance codes - check if column exists
  if (te.allowance_code !== undefined && te.allowance_code !== null) {
    const code = String(te.allowance_code).toUpperCase();
    if (code === 'UTL' || code === 'TRAVEL') return 'UTL';
    if (code === 'BON' || code === 'BONUS') return 'BON';
    return code;
  }

  return 'ARB'; // Normal work
}

