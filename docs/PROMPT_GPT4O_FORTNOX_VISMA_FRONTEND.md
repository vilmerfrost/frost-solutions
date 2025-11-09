# 🎯 PROMPT FÖR GPT-4O: MODERN REACT UI COMPONENTS

## 🎨 UPPGIFT: MODERNA, ACCESSIBLE UI COMPONENTS FÖR INTEGRATION MANAGEMENT

### Kontext

Du är GPT-4o och ska skapa **moderna, accessible React components** för Fortnox/Visma integration UI. Backend är redan implementerad, och nu behöver du skapa **production-ready UI components** med fokus på accessibility, animations, och modern UX patterns.

### Teknisk Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript (strict mode)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (optional) eller CSS transitions
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Befintlig UI-Struktur

- Vi har `app/components/ui/` med Button, Card, Dialog, etc.
- Vi använder Tailwind för styling
- Vi har dark mode support via `useTheme` hook
- Vi använder `useToast` för notifications

### Backend API Endpoints (Redan Implementerade)

- `GET /api/integrations/status` - Get integrations and sync status
- `POST /api/integrations/sync-invoice` - Manual sync invoice
- OAuth flows hanteras via redirects

### Dina Specifika Uppgifter

#### 1. **Integration Card Component** (Högsta prioritet)
- Skapa `IntegrationCard.tsx` - Visa integration status
- Visa provider logo/icon (Fortnox/Visma)
- Visa connection status (connected, expired, error)
- Visa senaste sync timestamp
- Animated status indicators
- Hover effects och transitions

#### 2. **Sync Status Badge Component** (Hög prioritet)
- Skapa `SyncStatusBadge.tsx` - Visa sync status
- Color-coded badges (success=green, error=red, pending=yellow)
- Animated pulse för pending status
- Tooltip med detaljerad information
- Accessible med ARIA labels

#### 3. **Sync Logs Table Component** (Hög prioritet)
- Skapa `SyncLogsTable.tsx` - Visa sync logs
- Sortable columns (date, status, operation)
- Filterable (by provider, status, date range)
- Pagination för stora datasets
- Row expansion för detaljerad log info
- Loading skeleton states

#### 4. **Connection Flow Modal** (Hög prioritet)
- Skapa `ConnectionFlowModal.tsx` - Guide användare genom OAuth
- Multi-step flow (1. Connect, 2. Authorize, 3. Success)
- Progress indicator
- Error handling med retry options
- Success animation

#### 5. **Quick Actions Menu** (Medel prioritet)
- Skapa `IntegrationActionsMenu.tsx` - Dropdown menu
- Actions: Sync Now, View Logs, Disconnect, Settings
- Keyboard navigation support
- Confirmation dialogs för destructive actions

### Specifika Implementation-Krav

1. **Accessibility**: WCAG 2.1 AA compliance
2. **Animations**: Smooth, performant animations
3. **Responsive**: Mobile-first, works on all screen sizes
4. **Dark Mode**: Full dark mode support
5. **Error States**: Tydliga error states med recovery options

### Önskad Output

1. **IntegrationCard Component**
   ```typescript
   // app/components/integrations/IntegrationCard.tsx
   - Provider logo/icon
   - Status badge
   - Last sync time
   - Action buttons
   - Hover effects
   ```

2. **SyncStatusBadge Component**
   ```typescript
   // app/components/integrations/SyncStatusBadge.tsx
   - Color-coded status
   - Animated pulse
   - Tooltip
   - ARIA labels
   ```

3. **SyncLogsTable Component**
   ```typescript
   // app/components/integrations/SyncLogsTable.tsx
   - Sortable columns
   - Filters
   - Pagination
   - Row expansion
   - Loading states
   ```

4. **ConnectionFlowModal Component**
   ```typescript
   // app/components/integrations/ConnectionFlowModal.tsx
   - Multi-step flow
   - Progress indicator
   - Error handling
   - Success animation
   ```

### Exempel Implementation

```typescript
// Exempel: Integration Card med animations
'use client';

import { motion } from 'framer-motion';
import { SyncStatusBadge } from './SyncStatusBadge';

export function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="rounded-lg border bg-white dark:bg-gray-800 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ProviderIcon provider={integration.provider} />
          <div>
            <h3 className="font-semibold">{integration.provider}</h3>
            <SyncStatusBadge status={integration.status} />
          </div>
        </div>
        <ActionButtons integration={integration} />
      </div>
    </motion.div>
  );
}
```

### Fokusområden

- ✅ **Modern UI**: Latest React patterns, animations, micro-interactions
- ✅ **Accessibility**: WCAG compliant, keyboard navigation, screen readers
- ✅ **Performance**: Optimized animations, lazy loading, code splitting
- ✅ **UX Excellence**: Intuitive, delightful, smooth interactions

### Viktigt

- Använd befintliga UI components som bas
- Följ Tailwind design system
- Implementera ALLA delar med full functionality
- Fokusera på accessibility och performance

---

**Fokus**: Modern UI components, accessibility, animations, excellent UX. Lösningen ska vara visuellt attraktiv och lätt att använda för alla användare.

