// app/lib/ai/templates.ts
import type { BudgetPrediction, InvoiceSuggestion, ProjectPlan, KmaItem, MaterialResult } from '@/types/ai';

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

export function templateMaterial(inputLabel: string): MaterialResult {
  return {
    name: inputLabel,
    confidence: 50,
    category: 'okänd',
    supplierItems: [],
    alternatives: [
      { name: 'Träregel 45x95', confidence: 35 },
      { name: 'Gipsskiva 13mm', confidence: 30 },
    ],
  };
}

export function templateKMA(projectType: string): {
  items: KmaItem[];
  projectType: string;
  confidence: 'high' | 'medium' | 'low';
} {
  const base: KmaItem[] = [
    {
      title: 'Riskbedömning arbetsmoment',
      category: 'Säkerhet',
      requiresPhoto: false,
      description: 'Identifiera risker innan start',
      order: 1,
    },
    {
      title: 'Personlig skyddsutrustning',
      category: 'Säkerhet',
      requiresPhoto: true,
      description: 'Foto på korrekt utrustning',
      order: 2,
    },
  ];

  const extra: Record<string, KmaItem[]> = {
    elektriker: [
      {
        title: 'Spänningslös kontroll',
        category: 'El',
        requiresPhoto: true,
        description: 'Visa mätning innan arbete',
        order: 3,
      },
    ],
    rörmokare: [
      {
        title: 'Tryckprovning',
        category: 'VVS',
        requiresPhoto: true,
        description: 'Foto av manometer',
        order: 3,
      },
    ],
    målare: [
      {
        title: 'Underlagskontroll',
        category: 'Ytskikt',
        requiresPhoto: true,
        description: 'Foto före och efter',
        order: 3,
      },
    ],
  };

  const items = [...base, ...(extra[projectType.toLowerCase()] ?? [])];
  return { items, projectType, confidence: 'high' };
}

export function templateInvoiceSuggestion(total: number): InvoiceSuggestion {
  return {
    totalAmount: Math.max(total, 0),
    suggestedDiscount: 0,
    invoiceRows: [
      {
        description: 'Arbetstid',
        quantity: 1,
        unitPrice: total,
        vat: 25,
        amount: total,
      },
    ],
    notes: 'Auto-genererat förslag (fallback).',
    confidence: 'low',
  };
}

export function templateProjectPlan(simple = true): ProjectPlan {
  const phases = simple
    ? [
        {
          name: 'Planering',
          duration: 2,
          resources: 1,
          description: 'Kickoff & materialbeställning',
          order: 1,
        },
        {
          name: 'Genomförande',
          duration: 5,
          resources: 2,
          description: 'Utförande av huvudmoment',
          order: 2,
        },
        {
          name: 'Avslut',
          duration: 1,
          resources: 1,
          description: 'Kontroll & överlämning',
          order: 3,
        },
      ]
    : [
        {
          name: 'Initiering',
          duration: 3,
          resources: 1,
          description: 'Scope, risk, tidsplan',
          order: 1,
        },
        {
          name: 'Etapp 1',
          duration: 10,
          resources: 3,
          description: 'Stomme/dragningar',
          order: 2,
        },
        {
          name: 'Etapp 2',
          duration: 10,
          resources: 3,
          description: 'Ytskikt/montering',
          order: 3,
        },
        {
          name: 'Test & godkännande',
          duration: 3,
          resources: 2,
          description: 'Provning, egenkontroll',
          order: 4,
        },
      ];

  const totalDays = phases.reduce((a, b) => a + b.duration, 0);
  return {
    phases,
    totalDays,
    bufferDays: Math.ceil(totalDays * 0.15),
    riskFactors: ['Leveransförsening', 'Resursbrist'],
    recommendedTeamSize: 2,
    confidenceLevel: simple ? 'medium' : 'low',
  };
}

