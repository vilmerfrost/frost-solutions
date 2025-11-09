# Prompt 2: ChatGPT 5 - Database & Query Optimization

Du är ChatGPT 5 och agerar database-expert och backend-arkitekt med fokus på PostgreSQL/Supabase optimering.

## Problem: Approval Status Reverts After Update

**Scenario:**
Next.js 16 app med Supabase backend. När admin godkänner tidsrapporter via bulk-approval API:
- UPDATE query körs och returnerar success
- Men när data hämtas via SELECT query 2-3 sekunder senare, är `approval_status` fortfarande `'pending'` eller `NULL`

**Database Schema:**
```sql
-- Migration har körts:
ALTER TABLE time_entries
  ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN approved_by UUID REFERENCES employees(id);

CREATE INDEX idx_time_entries_approval_status 
  ON time_entries(approval_status) 
  WHERE approval_status <> 'approved';
```

**API Implementation:**

Approve-all endpoint (`POST /api/time-entries/approve-all`):
```typescript
const updates = {
  approval_status: 'approved',
  approved_at: new Date().toISOString(),
  approved_by: context.employeeId
};

const { data, error } = await adminSupabase
  .from('time_entries')
  .update(updates)
  .eq('tenant_id', tenantId)
  .neq('approval_status', 'approved')  // Only update non-approved
  .select('id, approval_status, approved_at, approved_by');
```

List endpoint (`GET /api/time-entries/list`):
```typescript
const columnSet = await getTimeEntryColumnSet(adminSupabase);
const selectColumns = ['id', 'date', 'hours_total', ...];
if (columnSet.has('approval_status')) selectColumns.push('approval_status');
// ... adds other approval columns

const { data: entries } = await adminSupabase
  .from('time_entries')
  .select(selectColumns.join(', '))
  .eq('tenant_id', tenantId);
```

**Hypotheses:**
1. **Transaction isolation:** UPDATE commitar men SELECT läser från en annan transaction/snapshot
2. **Supabase PostgREST cache:** Response cache som returnerar gammal data
3. **RLS policies:** Row Level Security som filtrerar bort uppdaterade rader
4. **Query timing:** SELECT körs innan UPDATE transaction är committad
5. **Column detection:** `getTimeEntryColumnSet()` misslyckas och `approval_status` inkluderas inte i SELECT

**Frågor att besvara:**
1. Kan Supabase PostgREST cachea SELECT-responses som gör att vi får gammal data?
2. Finns det transaction isolation issues mellan UPDATE och SELECT?
3. Kan RLS policies påverka SELECT efter UPDATE även med service role?
4. Är `.neq('approval_status', 'approved')` korrekt syntax för att matcha både NULL och 'pending'?
5. Hur kan vi verifiera att UPDATE faktiskt ändrade raderna i databasen?

**Vad jag behöver:**
1. SQL queries för att direkt verifiera i Supabase SQL Editor att approval_status faktiskt uppdateras
2. Förbättringar av UPDATE query för att säkerställa commit
3. Förbättringar av SELECT query för att undvika cache och säkerställa fresh data
4. Debugging queries för att spåra vad som händer

Ge mig konkreta SQL-queries och kodändringar med fokus på database-layer.

