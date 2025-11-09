# 🧪 Test Guide - Fortnox Integration

## 📋 Översikt

Denna guide hjälper dig att testa alla delar av Fortnox-integrationen steg för steg.

---

## ✅ Förberedelser

### 1. Environment Variables

Kontrollera att du har lagt till i `.env.local`:

```env
FORTNOX_CLIENT_ID=ditt_client_id
FORTNOX_CLIENT_SECRET=ditt_client_secret
FORTNOX_REDIRECT_URI=http://localhost:3000/api/integrations/fortnox/callback
FORTNOX_BASE_URL=https://api.fortnox.se/3
ENCRYPTION_KEY_256_BASE64=din_encryption_key
```

### 2. Database Setup

Kör SQL-migrationen i Supabase SQL Editor:

```bash
# Kopiera innehållet från:
sql/CREATE_INTEGRATIONS_TABLES.sqlintegrations:1 Unchecked runtime.lastError: The message port closed before a response was received.
forward-logs-shared.ts:95 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
forward-logs-shared.ts:95 [HMR] connected
intercept-console-error.ts:42 ./frost-demo/app/api/integrations/route.ts:3:1
Module not found: Can't resolve '@/app/utils/supabase/admin'
  1 | // app/api/integrations/route.ts
  2 | import { NextRequest, NextResponse } from 'next/server';
> 3 | import { createAdminClient } from '@/app/utils/supabase/admin';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  4 | import { getTenantId } from '@/lib/work-orders/helpers';
  5 | import { extractErrorMessage } from '@/lib/errorUtils';
  6 |

Import map: aliased to relative './app/app/utils/supabase/admin' inside of [project]/frost-demo

https://nextjs.org/docs/messages/module-not-found
error @ intercept-console-error.ts:42
intercept-console-error.ts:42 ./frost-demo/app/api/integrations/route.ts:3:1
Module not found: Can't resolve '@/app/utils/supabase/admin'
  1 | // app/api/integrations/route.ts
  2 | import { NextRequest, NextResponse } from 'next/server';
> 3 | import { createAdminClient } from '@/app/utils/supabase/admin';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  4 | import { getTenantId } from '@/lib/work-orders/helpers';
  5 | import { extractErrorMessage } from '@/lib/errorUtils';
  6 |

Import map: aliased to relative './app/app/utils/supabase/admin' inside of [project]/frost-demo

https://nextjs.org/docs/messages/module-not-found
error @ intercept-console-error.ts:42
forward-logs-shared.ts:95 [SW] Registrering lyckades, scope: http://localhost:3000/
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
intercept-console-error.ts:42 ./frost-demo/app/api/integrations/route.ts:3:1
Module not found: Can't resolve '@/app/utils/supabase/admin'
  1 | // app/api/integrations/route.ts
  2 | import { NextRequest, NextResponse } from 'next/server';
> 3 | import { createAdminClient } from '@/app/utils/supabase/admin';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  4 | import { getTenantId } from '@/lib/work-orders/helpers';
  5 | import { extractErrorMessage } from '@/lib/errorUtils';
  6 |

Import map: aliased to relative './app/app/utils/supabase/admin' inside of [project]/frost-demo

https://nextjs.org/docs/messages/module-not-found
error @ intercept-console-error.ts:42
:3000/meta.json:1  Failed to load resource: the server responded with a status of 404 (Not Found)
intercept-console-error.ts:42 ./frost-demo/app/api/integrations/route.ts:3:1
Module not found: Can't resolve '@/app/utils/supabase/admin'
  1 | // app/api/integrations/route.ts
  2 | import { NextRequest, NextResponse } from 'next/server';
> 3 | import { createAdminClient } from '@/app/utils/supabase/admin';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  4 | import { getTenantId } from '@/lib/work-orders/helpers';
  5 | import { extractErrorMessage } from '@/lib/errorUtils';
  6 |

Import map: aliased to relative './app/app/utils/supabase/admin' inside of [project]/frost-demo

https://nextjs.org/docs/messages/module-not-found
error @ intercept-console-error.ts:42
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 ✅ TenantContext: Found tenant via centralized API: 8ee28f55-b780-4286-8137-9e70ea58ae56 source: jwt
forward-logs-shared.ts:95 ✅ TenantContext: Found tenant via centralized API: 8ee28f55-b780-4286-8137-9e70ea58ae56 source: jwt
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 135ms
forward-logs-shared.ts:95 🔗 Timestamp tie - using server version
forward-logs-shared.ts:95 🔗 Timestamp tie - using server version
forward-logs-shared.ts:95 ✅ Synced 2 updates from server
forward-logs-shared.ts:95 ✅ Sync completed successfully
:3000/api/integrations:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
:3000/api/integrations:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
:3000/api/integrations:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
:3000/api/integrations:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
npm
```

### 3. Starta Dev Server

```bash
npm run dev
```

---

## 🧪 Test 1: OAuth Connect Flow

### Steg 1: Navigera till Settings
1. Logga in som admin
2. Gå till: `http://localhost:3000/settings/integrations`
3. Förväntat: Du ser "Integrationer" sidan med "Inga integrationer är konfigurerade"

### Steg 2: Klicka på "Anslut till Fortnox"
1. Klicka på knappen "Anslut till Fortnox"
2. Förväntat: 
   - Knappen visar loading spinner
   - Du redirectas till Fortnox authorization page
   - URL: `https://apps.fortnox.se/oauth-v1/auth?...`

### Steg 3: Godkänn i Fortnox
1. Logga in med ditt Fortnox-konto
2. Godkänn applikationen
3. Förväntat: Redirect tillbaka till `/settings/integrations?connected=fortnox`

### Steg 4: Verifiera Success
1. Förväntat:
   - Toast notification: "Fortnox har anslutits!"
   - Integration Status Card visas med status "Ansluten"
   - Statistik visas (Kunder: 0, Fakturor: 0)

---

## 🧪 Test 2: Integration Status Card

### Steg 1: Kontrollera Status
1. Gå till `/settings/integrations`
2. Förväntat:
   - Status badge: "Ansluten" (grön)
   - Fortnox logo/icon visas
   - "Synka nu" och "Koppla från" knappar visas

### Steg 2: Testa "Synka nu"
1. Klicka på "Synka nu"
2. Förväntat:
   - Toast: "Synkronisering har startats"
   - Knappen visar loading spinner
   - Ett nytt jobb visas i Sync Dashboard (status: "Köad")

### Steg 3: Kontrollera Statistik
1. Förväntat:
   - "Senaste Synk" visar timestamp
   - "Kunder" visar antal synkade kunder
   - "Fakturor" visar antal synkade fakturor
   - "Totalt" visar summa

---

## 🧪 Test 3: Sync Dashboard

### Steg 1: Kontrollera Jobb-lista
1. Gå till `/settings/integrations`
2. Scrolla till "Synkroniseringskö"
3. Förväntat:
   - Lista över sync jobs visas
   - Varje jobb visar: job_type, status badge, försök, timestamp

### Steg 2: Testa Filtering
1. Klicka på filter-knappar: "Alla", "Köad", "Körs", "Slutförd", "Misslyckad"
2. Förväntat:
   - Listan filtreras korrekt
   - Aktiv filter-knapp är highlighted (blå)

### Steg 3: Kontrollera Jobb Status
1. Förväntat:
   - "Köad" jobs: Grå badge med Clock icon
   - "Körs" jobs: Blå badge med spinning Loader2 icon
   - "Slutförd" jobs: Grön badge med CheckCircle icon
   - "Misslyckad" jobs: Röd badge med XCircle icon + error message

### Steg 4: Testa Error Display
1. Om ett jobb misslyckas:
2. Förväntat:
   - Röd error box visas med felmeddelande
   - "Försök: X/Y" visas

---

## 🧪 Test 4: Manual Export

### Steg 1: Testa Export Kunder
1. Scrolla till "Manuell Export"
2. Klicka på "Exportera alla Kunder"
3. Förväntat:
   - Knappen visar loading spinner
   - Toast: "Kund har köats för export"
   - Ett nytt jobb visas i Sync Dashboard (job_type: "export_customer")

### Steg 2: Testa Export Fakturor
1. Klicka på "Exportera alla Fakturor"
2. Förväntat:
   - Knappen visar loading spinner
   - Toast: "Faktura har köats för export"
   - Ett nytt jobb visas i Sync Dashboard (job_type: "export_invoice")

### Steg 3: Verifiera i Database
1. Gå till Supabase SQL Editor
2. Kör:
```sql
SELECT * FROM app.integration_jobs 
WHERE tenant_id = 'din_tenant_id'
ORDER BY created_at DESC 
LIMIT 10;
```
3. Förväntat:
   - Jobb finns med korrekt `job_type` och `payload`
   - Status är "queued" eller "running"

---

## 🧪 Test 5: Sync History

### Steg 1: Kontrollera Logg-lista
1. Scrolla till "Synkroniseringshistorik"
2. Förväntat:
   - Lista över sync logs visas
   - Sorterade nyast först
   - Varje log visar: level icon, message, timestamp

### Steg 2: Testa Filtering
1. Klicka på filter-knappar: "Alla", "Info", "Varning", "Fel"
2. Förväntat:
   - Listan filtreras korrekt baserat på level
   - Aktiv filter-knapp är highlighted

### Steg 3: Testa Expandable Rows
1. För loggar med context (JSON):
2. Klicka på ChevronDown icon
3. Förväntat:
   - Rows expanderar
   - JSON context visas i formatted pre-tag
   - Chevron roterar 180 grader

### Steg 4: Kontrollera Log Levels
1. Förväntat:
   - Info: Blå Info icon
   - Warning: Gul AlertTriangle icon
   - Error: Röd XCircle icon

---

## 🧪 Test 6: Disconnect

### Steg 1: Testa Disconnect
1. Klicka på "Koppla från" knappen
2. Förväntat:
   - Confirmation dialog: "Är du säker på att du vill koppla bort Fortnox?"
   - Om du klickar "OK":
     - Toast: "Integrationen har kopplats bort"
     - Status badge ändras till "Frånkopplad" (grå)
     - "Anslut till Fortnox" knapp visas igen
     - Statistik och export-knappar försvinner

### Steg 2: Verifiera i Database
1. Gå till Supabase SQL Editor
2. Kör:
```sql
SELECT status, access_token_encrypted, refresh_token_encrypted 
FROM app.integrations 
WHERE id = 'din_integration_id';
```
3. Förväntat:
   - `status` = 'disconnected'
   - `access_token_encrypted` = NULL
   - `refresh_token_encrypted` = NULL

---

## 🧪 Test 7: Error Handling

### Steg 1: Testa Invalid Integration ID
1. Försök accessa `/api/integrations/invalid-id/status`
2. Förväntat:
   - Error response: "Integration hittades inte"
   - Status 404

### Steg 2: Testa Network Error
1. Stäng av internet
2. Klicka på "Synka nu"
3. Förväntat:
   - Toast error: "Kunde inte starta synk: [error message]"
   - Loading state försvinner

### Steg 3: Testa Admin Access
1. Logga in som non-admin (employee)
2. Försök accessa `/settings/integrations`
3. Förväntat:
   - "Åtkomst nekad" meddelande
   - Lock icon visas

---

## 🧪 Test 8: Real-time Updates

### Steg 1: Kontrollera Auto-refresh
1. Öppna `/settings/integrations`
2. Vänta 30 sekunder
3. Förväntat:
   - Integration status uppdateras automatiskt (via React Query refetchInterval)
   - Sync jobs uppdateras var 15:e sekund

### Steg 2: Testa Query Invalidation
1. Starta en sync
2. Förväntat:
   - Sync Dashboard uppdateras automatiskt när jobbet ändrar status
   - Ingen manuell refresh behövs

---

## 🧪 Test 9: Dark Mode

### Steg 1: Testa Dark Mode
1. Växla till dark mode i appen
2. Gå till `/settings/integrations`
3. Förväntat:
   - Alla komponenter har dark mode styling
   - Text är läsbar
   - Borders och backgrounds är synliga
   - Icons är synliga

---

## 🧪 Test 10: Database Queries

### Steg 1: Verifiera Integration Created
```sql
SELECT * FROM app.integrations 
WHERE tenant_id = 'din_tenant_id';
```
Förväntat:
- En integration med provider 'fortnox'
- status = 'connected'
- access_token_encrypted är krypterad (inte null)
- refresh_token_encrypted är krypterad (inte null)

### Steg 2: Verifiera Sync Jobs
```sql
SELECT * FROM app.integration_jobs 
WHERE tenant_id = 'din_tenant_id'
ORDER BY created_at DESC;
```
Förväntat:
- Jobb skapas när du exporterar
- Korrekt job_type, payload, status

### Steg 3: Verifiera Integration Mappings
```sql
SELECT * FROM app.integration_mappings 
WHERE tenant_id = 'din_tenant_id';
```
Förväntat:
- Mappings skapas när export lyckas
- Korrekt entity_type, local_id, remote_id

### Steg 4: Verifiera Sync Logs
```sql
SELECT * FROM app.sync_logs 
WHERE tenant_id = 'din_tenant_id'
ORDER BY created_at DESC;
```
Förväntat:
- Loggar skapas för varje sync operation
- Korrekt level, message, context

---

## 🐛 Troubleshooting

### Problem: "Tenant ID saknas"
**Lösning:**
- Kontrollera att du är inloggad
- Kontrollera att JWT har tenant_id claim
- Kontrollera `/api/tenant/get-tenant` fungerar

### Problem: "Integration hittades inte"
**Lösning:**
- Kontrollera att OAuth flow genomfördes
- Kontrollera att integration skapades i database
- Kontrollera tenant_id matchar

### Problem: OAuth redirect fungerar inte
**Lösning:**
- Kontrollera FORTNOX_REDIRECT_URI i .env.local
- Kontrollera att redirect URI matchar i Fortnox portal
- Kontrollera att callback route fungerar

### Problem: "ENCRYPTION_KEY_256_BASE64 måste vara 32 bytes"
**Lösning:**
- Generera ny key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- Lägg till i .env.local
- Starta om dev server

### Problem: Jobs körs inte
**Lösning:**
- Kontrollera att cron job körs: `/api/cron/sync-integrations`
- Kontrollera att cron är satt upp (Vercel cron eller liknande)
- Kontrollera att job status är 'queued'

### Problem: Dark mode ser inte bra ut
**Lösning:**
- Kontrollera att Tailwind dark mode är konfigurerat
- Kontrollera att alla komponenter har dark: classes
- Kontrollera att text colors är synliga i dark mode

---

## ✅ Checklista

- [ ] OAuth connect flow fungerar
- [ ] Integration status card visar korrekt status
- [ ] "Synka nu" fungerar
- [ ] Sync Dashboard visar jobs korrekt
- [ ] Filtering fungerar i Sync Dashboard
- [ ] Export buttons fungerar
- [ ] Sync History visar logs korrekt
- [ ] Filtering fungerar i Sync History
- [ ] Disconnect fungerar
- [ ] Error handling fungerar
- [ ] Admin-only access fungerar
- [ ] Dark mode fungerar
- [ ] Auto-refresh fungerar
- [ ] Database queries returnerar korrekt data

---

## 📊 Performance Tests

### Test 1: Load Time
1. Öppna `/settings/integrations`
2. Mät tid till första render
3. Förväntat: < 2 sekunder

### Test 2: Query Performance
1. Kör queries med 100+ jobs/logs
2. Förväntat: 
   - Pagination fungerar
   - Inga performance issues
   - Smooth scrolling

---

## 🎯 Success Criteria

Integrationen är klar när:
- ✅ OAuth flow fungerar end-to-end
- ✅ Status uppdateras i realtid
- ✅ Export fungerar och skapar jobs
- ✅ Sync Dashboard visar jobb korrekt
- ✅ Sync History visar logs korrekt
- ✅ All error handling fungerar
- ✅ Dark mode fungerar
- ✅ Admin-only access fungerar
- ✅ Inga console errors
- ✅ Inga TypeScript errors

---

**Lycka till med testningen!** 🚀

