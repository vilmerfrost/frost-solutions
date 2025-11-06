# ✨ Gemini 2.5 Frontend Implementation Prompt - AI-stöd för Frost Solutions

## 📋 KONTEXT

Frost Solutions är ett SaaS-projektledningssystem för svenska byggföretag. Backend AI-endpoints är redan implementerade och fungerar. Nu behöver vi premium UI-komponenter för att använda dessa AI-funktioner.

---

## 🎯 GEMINI 2.5 PROMPT

```
Du är en frontend-expert för React/Next.js med fokus på premium UX och AI-integrationer.

═══════════════════════════════════════════════════════════════════════════════
📋 PROJEKTKONTEKT
═══════════════════════════════════════════════════════════════════════════════

Frost Solutions är ett SaaS-projektledningssystem för svenska byggföretag.

TECH STACK:
- Framework: Next.js 16 App Router med React Server Components
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS med custom design system
- State Management: React Query (@tanstack/react-query v5)
- Icons: Lucide React
- Notifications: Sonner (via @/lib/toast)
- Dark Mode: Full support med dark: prefix
- Existing: AISummary komponent (referens för design)

BEFINTLIGA PATTERNS:
- React Query hooks: useQuery, useMutation, useQueryClient
- Tenant context: useTenant() från @/context/TenantContext
- Error handling: extractErrorMessage() från @/lib/errorUtils
- Toast notifications: toast.success(), toast.error() från @/lib/toast
- Design: Premium gradients, sparkles icons, smooth animations

═══════════════════════════════════════════════════════════════════════════════
🎯 UPPGIFT: IMPLEMENTERA AI-STÖD FRONTEND (PREMIUM UI)
═══════════════════════════════════════════════════════════════════════════════

Skapa 6 premium UI-komponenter för AI-funktioner. Alla endpoints fungerar redan.

═══════════════════════════════════════════════════════════════════════════════
1. AI BUDGETPROGNOS KOMPONENT (GRATIS - Statistisk analys)
═══════════════════════════════════════════════════════════════════════════════

Komponent: BudgetAIPrediction
Fil: app/components/ai/BudgetAIPrediction.tsx

FEATURES:
- Visa budgetprognos för ett projekt
- Visuell risk-indikator (grön/gul/röd)
- Progress bar för budgetanvändning
- Föreslagna åtgärder
- Graf över predikterad vs faktisk budget

API: POST /api/ai/predict-budget
Request: { projectId: string }
Response: { success: true, prediction: { currentSpend, budgetRemaining, currentProgress, predictedFinal, riskLevel, suggestions, confidence } }

DESIGN:
- Premium card med gradient (grön för low risk, gul för medium, röd för high)
- Sparkles-ikon för AI-indikator
- Progress bar med animerad fyllning
- Lista med åtgärdsförslag
- Confidence badge

═══════════════════════════════════════════════════════════════════════════════
2. AI MATERIALIDENTIFIERING KOMPONENT (GRATIS - Hugging Face)
═══════════════════════════════════════════════════════════════════════════════

Komponent: MaterialAIIdentifier
Fil: app/components/ai/MaterialAIIdentifier.tsx

FEATURES:
- Foto-uppladdning med drag & drop
- Live preview med AI-identifiering
- Confidence score visuellt (0-100%)
- Matchade supplier items från databas
- "Lägg till i projekt" funktionalitet

API: POST /api/ai/identify-material
Request: { imageBase64: string }
Response: { success: true, material: { name, confidence, category, supplierItems, alternatives }, model: 'huggingface' | 'template' }

DESIGN:
- Drag & drop area med border-dashed
- Preview av uppladdad bild
- Confidence meter (progress bar)
- Lista med matchade supplier items
- Alternativa material med confidence scores

═══════════════════════════════════════════════════════════════════════════════
3. AI KMA-FÖRSLAG KOMPONENT (GRATIS - Template)
═══════════════════════════════════════════════════════════════════════════════

Komponent: KMAIISuggestion
Fil: app/components/ai/KMAIISuggestion.tsx

FEATURES:
- Visa föreslagen checklista baserat på projekttyp
- Redigera items innan skapande
- "Använd AI-checklista" → skapa checklista
- Foto-krav markerade visuellt

API: POST /api/ai/suggest-kma-checklist
Request: { projectType: string }
Response: { success: true, checklist: { items: KmaItem[], projectType, confidence } }

DESIGN:
- Premium card med checklista-items
- Checkbox för varje item
- Foto-ikon för items som kräver foto
- "Använd förslag" knapp med gradient
- "Redigera" knapp för att modifiera items

═══════════════════════════════════════════════════════════════════════════════
4. AI FAKTURERINGSFÖRSLAG KOMPONENT (BETALT - Claude + Cache)
═══════════════════════════════════════════════════════════════════════════════

Komponent: InvoiceAISuggestion
Fil: app/components/ai/InvoiceAISuggestion.tsx

FEATURES:
- Visa föreslagna faktura-rader
- "Använd AI-förslag" → auto-fyll faktura-formulär
- "Redigera förslag" → öppna redigeringsläge
- Confidence indicators
- Cached-indikator (visa om resultat är från cache)

API: POST /api/ai/suggest-invoice
Request: { projectId: string }
Response: { success: true, suggestion: { totalAmount, suggestedDiscount, invoiceRows, notes, confidence }, model: 'claude-haiku', cached: boolean }

DESIGN:
- Premium card med gradient (blå-lila)
- Sparkles-ikon för AI
- Lista med faktura-rader (description, quantity, unitPrice, vat, amount)
- Total amount prominent
- Discount badge om rabatt föreslagen
- "Använd förslag" knapp (grön gradient)
- "Redigera" knapp (grå)
- Cached badge om cached: true

═══════════════════════════════════════════════════════════════════════════════
5. AI PROJEKTPLANERING KOMPONENT (BETALT - Claude Haiku/Sonnet)
═══════════════════════════════════════════════════════════════════════════════

Komponent: ProjectAIPlanning
Fil: app/components/ai/ProjectAIPlanning.tsx

FEATURES:
- Visa föreslagen tidsplan med faser
- Gantt-style visualization (enkel)
- Riskfaktorer listade
- "Använd AI-förslag" → auto-fyll projektdata
- Jämförelse med liknande projekt (valfritt)

API: POST /api/ai/suggest-project-plan
Request: { projectId: string }
Response: { success: true, plan: { phases, totalDays, bufferDays, riskFactors, recommendedTeamSize, confidenceLevel }, model: 'claude-haiku' | 'claude-sonnet', cached: boolean }

DESIGN:
- Premium card med fas-visualisering
- Gantt-style bars för varje fas (duration)
- Riskfaktorer i gul/röd box
- Totalt antal dagar prominent
- Buffer-dagar markerade
- "Använd förslag" knapp
- Model badge (Haiku/Sonnet)

═══════════════════════════════════════════════════════════════════════════════
6. FÖRBÄTTRA BEFINTLIG AISummary KOMPONENT
═══════════════════════════════════════════════════════════════════════════════

Fil: app/components/AISummary.tsx (REDAN FINNS)

FÖRBÄTTRINGAR:
- Lägg till cached-indikator
- Förbättra loading states (skeleton loader)
- Lägg till fler typer (kunder, anställda)
- Bättre error handling med retry
- Streaming support (valfritt, för framtida förbättring)

═══════════════════════════════════════════════════════════════════════════════
🔧 IMPLEMENTATION REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

1. REACT QUERY HOOKS
   - Skapa useMutation hooks för varje AI-endpoint
   - Använd useQuery för cached data där lämpligt
   - Implementera optimistic updates där möjligt
   - Error handling med extractErrorMessage()

2. TYPE SAFETY
   - Använd typer från @/types/ai.ts
   - TypeScript strict mode
   - Inga any types (utom där absolut nödvändigt)

3. DESIGN SYSTEM
   - Matcha befintlig AISummary design
   - Premium gradients: from-purple-50 to-blue-50 (light), from-purple-900/20 to-blue-900/20 (dark)
   - Sparkles-ikon från lucide-react för AI-indikator
   - Smooth animations med transition-all
   - Dark mode support med dark: prefix

4. LOADING STATES
   - Skeleton loaders för initial load
   - Spinner för AI-anrop
   - Disabled states på knappar under loading

5. ERROR HANDLING
   - Toast notifications för errors
   - Retry-funktionalitet
   - Fallback UI när AI misslyckas
   - Rate limit errors (429) hanteras särskilt

6. UX PRINCIPLES
   - AI ska hjälpa, inte ersätta användaren
   - Alltid möjlighet att redigera AI-förslag
   - Tydlig feedback när AI arbetar
   - Diskret men synlig AI-presens
   - "Använd förslag" vs "Redigera förslag" tydligt separerade

7. RESPONSIVE DESIGN
   - Mobil-först approach
   - Breakpoints: sm:, md:, lg:
   - Touch-friendly knappar (min 44x44px)

8. ACCESSIBILITY
   - ARIA labels för AI-funktioner
   - Keyboard navigation
   - Screen reader support
   - Focus states tydliga

═══════════════════════════════════════════════════════════════════════════════
📝 CODE STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Filstruktur:
- app/components/ai/BudgetAIPrediction.tsx
- app/components/ai/MaterialAIIdentifier.tsx
- app/components/ai/KMAIISuggestion.tsx
- app/components/ai/InvoiceAISuggestion.tsx
- app/components/ai/ProjectAIPlanning.tsx
- app/components/AISummary.tsx (förbättra befintlig)
- app/hooks/useAIBudgetPrediction.ts
- app/hooks/useAIMaterialIdentification.ts
- app/hooks/useAIKMA.ts
- app/hooks/useAIInvoiceSuggestion.ts
- app/hooks/useAIProjectPlan.ts

═══════════════════════════════════════════════════════════════════════════════
🎨 DESIGN PATTERNS (FRÅN BEFINTLIG AISummary)
═══════════════════════════════════════════════════════════════════════════════

CARD STYLING:
```tsx
<div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800">
  {/* Content */}
</div>
```

AI BADGE:
```tsx
<div className="flex items-center gap-2">
  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">AI Förslag</span>
</div>
```

BUTTON STYLING:
```tsx
<button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
  Använd förslag
</button>
```

LOADING STATE:
```tsx
<div className="flex items-center gap-3">
  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
  <span className="text-sm text-gray-600 dark:text-gray-400">Analyserar med AI...</span>
</div>
```

═══════════════════════════════════════════════════════════════════════════════
✅ ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════════════

1. Alla 6 komponenter implementerade
2. React Query hooks för alla AI-endpoints
3. Premium design matchar befintlig AISummary
4. Dark mode support
5. Responsive design (mobil-först)
6. Error handling med toast notifications
7. Loading states för alla AI-anrop
8. TypeScript strict mode, inga any types
9. Accessibility (ARIA labels, keyboard nav)
10. Alla komponenter testade och fungerar

═══════════════════════════════════════════════════════════════════════════════
🚀 EXEMPEL: REACT QUERY HOOK PATTERN
═══════════════════════════════════════════════════════════════════════════════

```typescript
// app/hooks/useAIInvoiceSuggestion.ts
'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { extractErrorMessage } from '@/lib/errorUtils'
import type { InvoiceSuggestion } from '@/types/ai'

export function useAIInvoiceSuggestion() {
  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch('/api/ai/suggest-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Okänt fel' }))
        throw new Error(errorData.error || 'Kunde inte generera förslag')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Kunde inte generera förslag')
      }

      return data.suggestion as InvoiceSuggestion
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error)
      toast.error(`Kunde inte generera förslag: ${message}`)
    },
  })
}
```

═══════════════════════════════════════════════════════════════════════════════

BÖRJA MED:
1. Skapa React Query hooks för alla AI-endpoints
2. Implementera BudgetAIPrediction (enklast, gratis)
3. Implementera InvoiceAISuggestion (högst värde)
4. Implementera resterande komponenter
5. Förbättra befintlig AISummary
6. Testa alla komponenter
7. Verifiera design matchar befintlig stil

LYCKA TILL! 🚀✨
```

