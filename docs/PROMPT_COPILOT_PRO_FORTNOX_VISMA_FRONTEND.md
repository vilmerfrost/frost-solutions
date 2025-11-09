# 🎯 PROMPT FÖR COPILOT PRO: REACT QUERY HOOKS & STATE MANAGEMENT

## 🔧 UPPGIFT: REACT QUERY HOOKS & STATE MANAGEMENT FÖR INTEGRATIONS

### Kontext

Du är Copilot Pro och ska implementera **React Query hooks och state management** för Fortnox/Visma integration UI. Backend API är redan implementerad, och nu behöver du skapa **production-ready React Query hooks** med caching, invalidation, och optimistic updates.

### Teknisk Stack

- **Framework**: Next.js 16 App Router
- **State Management**: React Query (@tanstack/react-query)
- **Language**: TypeScript (strict mode)
- **Forms**: React Hook Form + Zod validation
- **API Client**: Fetch API (native)

### Befintlig Hook-Struktur

- Vi har `app/hooks/usePayrollPeriods.ts` som exempel
- Vi använder React Query för data fetching
- Vi har `useToast` för notifications
- Vi använder `useMutation` och `useQuery`

### Backend API Endpoints (Redan Implementerade)

- `GET /api/integrations/status` - Get integrations and sync logs
- `POST /api/integrations/sync-invoice` - Manual sync invoice
- OAuth flows hanteras via redirects

### Dina Specifika Uppgifter

#### 1. **Integration Hooks** (Högsta prioritet)
- Skapa `app/hooks/useIntegrations.ts`
- `useIntegrations()` - Fetch all integrations for tenant
- `useIntegration(provider)` - Fetch single integration
- `useConnectIntegration()` - Start OAuth flow (mutation)
- `useDisconnectIntegration()` - Disconnect integration (mutation)
- Automatic cache invalidation efter mutations

#### 2. **Sync Status Hooks** (Högsta prioritet)
- Skapa `app/hooks/useSyncStatus.ts`
- `useSyncStatus()` - Fetch sync status and statistics
- `useSyncLogs(filters?)` - Fetch sync logs with filters
- Polling för real-time updates (every 30 seconds)
- Optimistic updates för manual syncs

#### 3. **Sync Operations Hooks** (Hög prioritet)
- Skapa `app/hooks/useSyncOperations.ts`
- `useSyncInvoice()` - Manual sync invoice mutation
- `useSyncCustomer()` - Manual sync customer mutation
- `useBatchSync()` - Batch sync multiple resources
- Loading states och progress tracking
- Error handling med retry logic

#### 4. **Integration Status Polling** (Hög prioritet)
- Implementera smart polling strategy
- Pause polling när tab är inactive
- Resume polling när tab becomes active
- Exponential backoff för failed requests

#### 5. **Cache Management** (Medel prioritet)
- Implementera cache invalidation strategies
- Prefetch related data
- Optimistic updates för better UX
- Cache persistence strategies

### Specifika Implementation-Krav

1. **Type Safety**: Använd TypeScript types från `@/types/integrations`
2. **Error Handling**: Tydliga error messages med `useToast`
3. **Loading States**: Expose loading states för UI components
4. **Optimistic Updates**: Update UI immediately, rollback on error
5. **Cache Invalidation**: Smart invalidation efter mutations

### Önskad Output

1. **useIntegrations Hook**
   ```typescript
   // app/hooks/useIntegrations.ts
   export function useIntegrations() {
     return useQuery({
       queryKey: ['integrations'],
       queryFn: () => IntegrationAPI.list(),
       staleTime: 30000, // 30 seconds
     });
   }
   
   export function useConnectIntegration() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: (provider: Provider) => IntegrationAPI.connect(provider),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['integrations'] });
       },
     });
   }
   ```

2. **useSyncStatus Hook**
   ```typescript
   // app/hooks/useSyncStatus.ts
   export function useSyncStatus() {
     return useQuery({
       queryKey: ['sync-status'],
       queryFn: () => IntegrationAPI.getStatus(),
       refetchInterval: 30000, // Poll every 30 seconds
     });
   }
   ```

3. **useSyncOperations Hook**
   ```typescript
   // app/hooks/useSyncOperations.ts
   export function useSyncInvoice() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: ({ invoiceId, provider }) => 
         IntegrationAPI.syncInvoice(invoiceId, provider),
       onMutate: async (variables) => {
         // Optimistic update
         await queryClient.cancelQueries({ queryKey: ['sync-status'] });
         // ... optimistic update logic
       },
       onError: (err, variables, context) => {
         // Rollback optimistic update
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['sync-status'] });
       },
     });
   }
   ```

### Exempel Implementation

```typescript
// Exempel: Smart polling hook
export function useSyncStatusWithPolling(enabled: boolean = true) {
  const [isTabActive, setIsTabActive] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return useQuery({
    queryKey: ['sync-status'],
    queryFn: () => IntegrationAPI.getStatus(),
    enabled: enabled && isTabActive,
    refetchInterval: isTabActive ? 30000 : false,
    refetchIntervalInBackground: false,
  });
}
```

### Fokusområden

- ✅ **React Query Best Practices**: Proper caching, invalidation, optimistic updates
- ✅ **Performance**: Smart polling, cache management, code splitting
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Error Handling**: Robust error handling med retry logic

### Viktigt

- Följ React Query best practices
- Använd TypeScript strict mode
- Implementera ALLA hooks med full functionality
- Fokusera på performance och cache management

---

**Fokus**: React Query hooks, state management, caching strategies, optimistic updates. Lösningen ska vara performant och lätt att använda i UI components.

