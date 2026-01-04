// app/lib/rot/rules.ts
/**
 * ROT calculation rules and utilities
 */

export function rotPercentFor(dateISO: string): 30 | 50 {
 const d = new Date(dateISO);
 const year = d.getUTCFullYear();
 const month = d.getUTCMonth() + 1;

 // 2025: Jan–Apr 30%, Maj–Dec 50%
 if (year === 2025 && month <= 4) {
  return 30;
 }
 return 50;
}

export function rotDeduction(laborSEK: number, percent: 30 | 50): number {
 return Math.round(laborSEK * (percent / 100) * 100) / 100;
}

export function calculateMaxDeduction(laborCost: number): number {
 const maxAnnualDeduction = 50000; // Max per person per year
 return Math.min(laborCost * 0.5, maxAnnualDeduction);
}

