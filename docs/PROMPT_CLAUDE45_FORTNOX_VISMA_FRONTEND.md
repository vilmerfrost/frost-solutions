# 🎯 PROMPT FÖR CLAUDE 4.5: FRONTEND INTEGRATION UI

## 🎨 UPPGIFT: KOMPLETT FRONTEND IMPLEMENTATION FÖR FORTNOX/VISMA INTEGRATION

### Kontext

Du är Claude 4.5 och ska implementera **komplett frontend UI** för Fortnox/Visma integration i Frost Solutions. Backend är redan implementerad med OAuth flows, API clients, och sync architecture. Nu behöver du skapa en **production-ready frontend** med React, Next.js 16 App Router, och TypeScript.

### Teknisk Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript (strict mode)
- **UI Library**: React + Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS (dark mode support)

### Befintlig Frontend-Struktur

- Vi har payroll export UI (`app/components/payroll/`)
- Vi använder React Query hooks (`app/hooks/`)
- Vi har API client helpers (`app/lib/api/`)
- Vi har UI components (`app/components/ui/`)
- Vi använder `useToast` för notifications
- Vi har `SidebarClient` för navigation

### Backend API Endpoints (Redan Implementerade)

- `GET /api/integrations/authorize/[provider]` - Start OAuth flow
- `GET /api/integrations/callback/[provider]` - OAuth callback handler
- `POST /api/integrations/sync-invoice` - Manual sync invoice
- `GET /api/integrations/status` - Get sync status and logs

### Dina Specifika Uppgifter

#### 1. **Integration Management Page** (Högsta prioritet)
- Skapa `/app/integrations/page.tsx` - Huvudsida för integration management
- Visa lista över aktiva integrations (Fortnox/Visma)
- Visa status för varje integration (connected, expired, error)
- Knappar för att koppla/koppla från integrations
- Visa senaste sync-status och fel

#### 2. **OAuth Connect Flow** (Högsta prioritet)
- Skapa `ConnectIntegrationButton` component
- Hantera OAuth redirect flow
- Visa loading states under OAuth process
- Hantera OAuth errors och visa användarvänliga felmeddelanden
- Success/error callbacks efter OAuth callback

#### 3. **Sync Status Dashboard** (Hög prioritet)
- Skapa `SyncStatusCard` component
- Visa sync statistics (success, failed, pending)
- Visa senaste sync logs i tabell
- Real-time updates med React Query polling
- Filter för att visa logs per provider eller status

#### 4. **Manual Sync UI** (Hög prioritet)
- Skapa `SyncInvoiceButton` component
- Knapp för att manuellt synka en faktura
- Loading states och progress indicators
- Success/error notifications
- Disable knapp om integration inte är aktiv

#### 5. **Conflict Resolution UI** (Medel prioritet)
- Skapa `ConflictResolutionDialog` component
- Visa konflikter mellan Frost och externa system
- Möjlighet att välja vilken version som ska vinna
- Preview av ändringar innan resolution

### Specifika Implementation-Krav

1. **Type Safety**: Använd TypeScript types från `@/types/integrations`
2. **Error Handling**: Tydliga felmeddelanden med `useToast`
3. **Loading States**: Skeleton loaders och spinners
4. **Responsive Design**: Mobile-first approach
5. **Dark Mode**: Stöd för dark mode via Tailwind

### Önskad Output

1. **Main Integration Page**
   ```typescript
   // app/integrations/page.tsx
   - Lista över integrations
   - Connect/Disconnect buttons
   - Sync status cards
   - Recent sync logs
   ```

2. **React Query Hooks**
   ```typescript
   // app/hooks/useIntegrations.ts
   - useIntegrations() - Fetch integrations
   - useConnectIntegration() - Start OAuth flow
   - useDisconnectIntegration() - Disconnect integration
   - useSyncStatus() - Fetch sync status
   - useSyncInvoice() - Manual sync invoice
   ```

3. **UI Components**
   ```typescript
   // app/components/integrations/
   - ConnectIntegrationButton.tsx
   - IntegrationCard.tsx
   - SyncStatusCard.tsx
   - SyncLogsTable.tsx
   - ConflictResolutionDialog.tsx
   ```

4. **API Client**
   ```typescript
   // app/lib/api/integrations.ts
   - IntegrationAPI class med alla endpoints
   ```

### Exempel Implementation

```typescript
// Exempel: Connect Integration Button
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function ConnectIntegrationButton({ provider }: { provider: 'fortnox' | 'visma' }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Redirect to OAuth authorization
      window.location.href = `/api/integrations/authorize/${provider}`;
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte starta OAuth flow',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? 'Ansluter...' : `Anslut ${provider}`}
    </Button>
  );
}
```

### Fokusområden

- ✅ **Fullstack-perspektiv**: Se både frontend och backend integration
- ✅ **Production-ready**: Robust error handling, loading states, UX
- ✅ **Maintainability**: Tydlig kod-struktur, komponenter, hooks
- ✅ **User Experience**: Intuitiv UI, tydliga feedback, smooth flows

### Viktigt

- Använd befintliga UI patterns från payroll components
- Följ Tailwind styling från resten av appen
- Implementera ALLA delar (inte bara stub)
- Fokusera på production-ready kod med robust error handling

---

**Fokus**: Fullstack-analys, komplett frontend implementation, production-ready UI, excellent UX. Lösningen ska vara lätt att använda och underhålla.

