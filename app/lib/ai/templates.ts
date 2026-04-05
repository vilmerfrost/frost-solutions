import type { BudgetPrediction } from '@/types/ai';

export function templateBudget(pred: Partial<BudgetPrediction>): BudgetPrediction {
  const p = {
    currentSpend: 0,
    budgetRemaining: 0,
    currentProgress: 0,
    predictedFinal: 0,
    riskLevel: 'low' as const,
    suggestions: [],
    confidence: 'medium' as const,
    ...pred,
  };

  if (p.riskLevel === 'high') {
    p.suggestions.push('Lås scope, pausa icke-kritiska uppgifter, förankra tillägg innan fortsatt arbete.');
  }
  if (p.riskLevel === 'medium') {
    p.suggestions.push('Öka uppföljningsfrekvens, förtydliga leverabler och tidplan.');
  }
  if (p.riskLevel === 'low') {
    p.suggestions.push('Fortsätt enligt plan men följ upp var vecka.');
  }

  return p as BudgetPrediction;
}
