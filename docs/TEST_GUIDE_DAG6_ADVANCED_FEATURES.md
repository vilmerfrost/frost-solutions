# 🧪 TEST GUIDE - DAY 6 ADVANCED FEATURES

## Snabb testguide för P0-features

---

## ✅ FÖRE TESTNING

### 1. Kör SQL-filer i Supabase (i ordning):
```sql
1. sql/CREATE_RBAC_SCHEMA.sql
2. sql/CREATE_FULLTEXT_SEARCH.sql
3. sql/CREATE_DASHBOARD_ANALYTICS.sql
```

### 2. Exponera `app`-schema i Supabase:
- Gå till Supabase Dashboard → Database → API
- Under "Exposed schemas", lägg till `app`
- Spara

### 3. Starta dev-server:
```bash
cd frost-demo
npm run dev
```

---

## 1️⃣ RBAC & PERMISSIONS - TESTNING

### Test 1: Kontrollera att permissions API fungerar

**Steg:**
1. Öppna browser console (F12)
2. Kör:
```javascript
fetch('/api/rbac/permissions')
  .then(r => r.json())
  .then(console.log)
```

**Förväntat resultat:**
```json
{
  "success": true,
  "role": "admin" | "employee" | etc,
  "permissions": [
    { "resource": "projects", "action": "read" },
    ...
  ]
}
```

### Test 2: Testa PermissionGuard i Projects-sidan

**Steg:**
1. Gå till `/projects`
2. Kontrollera att "Skapa nytt projekt"-knappen visas om du är admin
3. Om du är employee, ska knappen inte visas

**Implementera i `app/projects/page.tsx`:**
```typescript
import { PermissionGuard } from '@/components/rbac/PermissionGuard';

// Lägg till i din komponent:
<PermissionGuard resource="projects" action="create">
  <button onClick={handleCreateProject}>
    Skapa nytt projekt
  </button>
</PermissionGuard>
```

### Test 3: Testa useCan hook

**Steg:**
1. Öppna React DevTools
2. I en komponent, använd:
```typescript
import { useCan } from '@/hooks/usePermissions';

const { can, isLoading } = useCan('projects', 'delete');
console.log('Can delete projects:', can);
```

**Förväntat resultat:**
- `can: true` om du är admin
- `can: false` om du är employee
- `isLoading: false` efter fetch

---

## 2️⃣ ADVANCED SEARCH - TESTNING

### Test 1: Lägg till SearchBar i header/sidebar

**Steg:**
1. Öppna `app/components/SidebarClient.tsx` eller din header-komponent
2. Lägg till:
```typescript
import { SearchBar } from '@/components/search/SearchBar';

// I din komponent:
<SearchBar />
```

### Test 2: Testa sökfunktion

**Steg:**
1. Gå till en sida där SearchBar är synlig
2. Skriv minst 2 tecken (t.ex. "proj")
3. Vänta 300ms (debounce)
4. Kontrollera att dropdown visas med resultat

**Förväntat beteende:**
- ✅ Dropdown visas med kategorier (Projekt, Kunder, Fakturor)
- ✅ Klick på resultat länkar till rätt sida
- ✅ Loading spinner visas under sökning
- ✅ "Inga resultat" visas om inget hittas

### Test 3: Testa svenska tecken

**Steg:**
1. Sök på "målning" eller "mönstring"
2. Kontrollera att resultat hittas även med å/ä/ö

**Förväntat resultat:**
- ✅ Sökning fungerar med svenska tecken
- ✅ Case-insensitive (stora/små bokstäver)

### Test 4: Testa Search API direkt

**Steg:**
1. Öppna browser console
2. Kör:
```javascript
fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'test' })
})
  .then(r => r.json())
  .then(console.log)
```

**Förväntat resultat:**
```json
{
  "success": true,
  "data": {
    "projects": [...],
    "clients": [...],
    "invoices": [...]
  },
  "query": "test"
}
```

---

## 3️⃣ DASHBOARD ANALYTICS - TESTNING

### Test 1: Lägg till DashboardAnalytics på dashboard

**Steg:**
1. Öppna `app/dashboard/page.tsx` (eller din dashboard-sida)
2. Lägg till:
```typescript
import { DashboardAnalytics } from '@/components/analytics/DashboardAnalytics';

// I din komponent:
<DashboardAnalytics />
```

### Test 2: Testa dashboard analytics

**Steg:**
1. Gå till `/dashboard`
2. Kontrollera att analytics visas

**Förväntat resultat:**
- ✅ KPI-kort visas (Aktiva projekt, Anställda, etc.)
- ✅ Period-väljare fungerar (Vecka/Månad/År)
- ✅ Projektprestanda-lista visas
- ✅ Loading spinner visas under laddning
- ✅ Error-meddelande visas om något går fel

### Test 3: Testa period-växling

**Steg:**
1. Klicka på "Vecka", "Månad", "År"
2. Kontrollera att data uppdateras

**Förväntat beteende:**
- ✅ Data uppdateras när period ändras
- ✅ Loading spinner visas under uppdatering

### Test 4: Testa Dashboard Analytics API

**Steg:**
1. Öppna browser console
2. Kör:
```javascript
fetch('/api/analytics/dashboard?period=month')
  .then(r => r.json())
  .then(console.log)
```

**Förväntat resultat:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "activeProjects": 5,
      "totalEmployees": 10,
      "totalHours": 120.5,
      ...
    },
    "kpis": {
      "budgetVariance": 2.5,
      "utilization": 0.85,
      ...
    },
    "projectPerformance": [...],
    "period": "month"
  }
}
```

### Test 5: Lägg till ProjectAnalytics på projekt-sida

**Steg:**
1. Öppna `app/projects/[id]/page.tsx`
2. Lägg till:
```typescript
import { ProjectAnalytics } from '@/components/analytics/ProjectAnalytics';

// I din komponent (efter projekt-info):
<ProjectAnalytics projectId={projectId} />
```

### Test 6: Testa projekt-analytics

**Steg:**
1. Gå till ett specifikt projekt (t.ex. `/projects/[id]`)
2. Scrolla ner till analytics-sektionen

**Förväntat resultat:**
- ✅ Status-kort visas (Schema, Budget, Lönsamhet)
- ✅ Metrics visas (Faktiska timmar, Planerade timmar, etc.)
- ✅ KPI-kort visas (SPI, CPI)
- ✅ Status-indikatorer är korrekta (grön/röd)

### Test 7: Testa Project Analytics API

**Steg:**
1. Hämta ett projekt-ID från databasen
2. Öppna browser console
3. Kör:
```javascript
fetch('/api/projects/[PROJECT_ID]/analytics')
  .then(r => r.json())
  .then(console.log)
```

**Förväntat resultat:**
```json
{
  "success": true,
  "data": {
    "project": { "id": "...", "name": "...", "status": "..." },
    "metrics": {
      "actualHours": 120.5,
      "plannedHours": 100,
      ...
    },
    "kpis": {
      "spi": 1.2,
      "cpi": 0.95,
      ...
    },
    "status": {
      "onSchedule": true,
      "onBudget": true,
      "profitable": true
    }
  }
}
```

---

## 🐛 VANLIGA PROBLEM & LÖSNINGAR

### Problem 1: "Permission denied" eller 403
**Lösning:**
- Kontrollera att SQL-filerna är körda
- Kontrollera att `app`-schema är exponerat i Supabase
- Kontrollera att användaren har en roll i `app.user_roles`

### Problem 2: Search returnerar inga resultat
**Lösning:**
- Kontrollera att `search_text` kolumner är uppdaterade (triggers)
- Kontrollera att `swedish_unaccent` extension är aktiverad
- Testa med enkla sökord först

### Problem 3: Analytics visar 0 eller felaktiga värden
**Lösning:**
- Kontrollera att det finns data i `time_entries`, `invoices`, etc.
- Kontrollera att `tenant_id` är korrekt
- Kontrollera browser console för fel

### Problem 4: "Module not found" errors
**Lösning:**
- Kör `npm install` om du har lagt till nya dependencies
- Kontrollera att alla import-paths är korrekta
- Restart dev-server

---

## ✅ CHECKLISTA FÖR FULLSTÄNDIG TESTNING

### RBAC:
- [ ] Permissions API returnerar korrekt data
- [ ] PermissionGuard döljer/visar komponenter korrekt
- [ ] useCan hook returnerar korrekt `can`-värde
- [ ] Admin kan se "Skapa"-knappar
- [ ] Employee kan INTE se "Skapa"-knappar

### Search:
- [ ] SearchBar visas i UI
- [ ] Sökning fungerar med minst 2 tecken
- [ ] Dropdown visas med resultat
- [ ] Klick på resultat länkar till rätt sida
- [ ] Svenska tecken (å/ä/ö) fungerar
- [ ] Loading state visas
- [ ] "Inga resultat" visas när inget hittas

### Analytics:
- [ ] DashboardAnalytics visas på dashboard
- [ ] KPI-kort visar korrekta värden
- [ ] Period-växling fungerar
- [ ] Projektprestanda-lista visas
- [ ] ProjectAnalytics visas på projekt-sida
- [ ] Status-indikatorer är korrekta
- [ ] SPI/CPI beräknas korrekt

---

## 🚀 NÄSTA STEG

Efter att allt fungerar:
1. Integrera SearchBar i header/sidebar globalt
2. Lägg till PermissionGuard på fler sidor (invoices, clients, etc.)
3. Lägg till ProjectAnalytics på alla projekt-sidor
4. Överväg att lägga till DashboardAnalytics på admin-sidan

**Lycka till med testningen! 🎯**

