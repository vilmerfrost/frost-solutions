// app/lib/rot/calc.ts
export function resolveRotPercent(invoiceDateISO: string): 30 | 50 {
  const d = new Date(invoiceDateISO);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  
  // Regel 2025: Jan–Apr = 30%, Maj–Dec = 50% (du sa jan–maj 30 / maj–dec 50 → tolkar som t.o.m. April 30)
  if (y === 2025 && m <= 4) return 30;
  return 50;
}

export function calcRot(laborSEK: number, percent: 30 | 50): number {
  const deduction = Math.round(laborSEK * (percent / 100) * 100) / 100;
  return deduction;
}

