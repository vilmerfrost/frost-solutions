# Prompt 3: GPT-4o - Frontend & State Management

Du är GPT-4o och agerar React/Next.js frontend-expert med fokus på state management och data synchronization.

## Problem: React State Shows Wrong Approval Status

**Symptom:**
I en Next.js 16 app med React Query:
- Admin klickar "Godkänn alla" → API returnerar success med `updated: 19`
- Toast visar "Alla tidsrapporter godkändes"
- UI uppdateras temporärt till "Godkänd" (3 sekunder)
- Efter refetch från API visar alla entries fortfarande "Ej godkänd"

**Frontend Code:**

```typescript
// app/reports/page.tsx
async function handleApproveAll() {
  const res = await fetch('/api/time-entries/approve-all', { method: 'POST' });
  const data = await res.json();
  
  if (data.success && data.updated > 0) {
    toast.success(`Godkände ${data.updated} tidsrapporter`);
    
    // Update local state optimistically
    setEntries(prev => prev.map(entry => ({
      ...entry,
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
    })));
    
    // Wait 1 second then refetch
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTrigger(prev => prev + 1); // Triggers useEffect refetch
  }
}

useEffect(() => {
  async function fetchEntries() {
    const response = await fetch('/api/time-entries/list', { cache: 'no-store' });
    const result = await response.json();
    const entries = result.entries || [];
    
    // Enrich with project/employee data
    const enriched = entries.map(e => ({
      ...e,
      projects: projectsMap.get(e.project_id),
      employees: employeesMap.get(e.employee_id),
    }));
    
    setEntries(enriched);
  }
  fetchEntries();
}, [tenantId, refreshTrigger]);

const isEntryApproved = (entry: TimeEntry) => {
  const approvalStatus = (entry.approval_status || '').toLowerCase();
  return approvalStatus === 'approved' || Boolean(entry.approved_at);
};
```

**Observations:**
- `sample` i console logs visar inte `approval_status` (kanske undefined?)
- `approvedCount` i logs är 0 även efter godkännande
- Refetch händer flera gånger (event listener + refreshTrigger)

**Hypotheses:**
1. **State overwrite:** Optimistic update skrivs över av refetch som hämtar gammal data
2. **API response mapping:** `approval_status` finns inte i API-svaret eller mappas bort vid enrichment
3. **Race condition:** Refetch körs innan backend commit är klar
4. **Cache issue:** Browser eller Next.js cachear `/api/time-entries/list` response
5. **Event listener loop:** `timeEntryUpdated` event triggas flera gånger och orsakar race

**Vad jag behöver:**
1. Analys av state flow: optimistic update → API call → refetch → UI render
2. Förbättringar av state management för att undvika race conditions
3. Bättre error handling och logging för att se vad API faktiskt returnerar
4. Strategi för att säkerställa UI synkas med backend state
5. Fix för event listener som triggas flera gånger

Ge mig konkreta React/Next.js kodändringar med fokus på frontend state management och data synchronization.

