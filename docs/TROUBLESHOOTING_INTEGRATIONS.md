# Felsökning: Integrations-sidan

## Problem: 503-fel på status-endpoints

### Symptom
- Flera 503-fel i browser console: `Failed to load resource: the server responded with a status of 503`
- Integrationer kan inte laddas eller uppdateras
- Status-kort visar varningar om att status inte kunde hämtas

### Möjliga orsaker

1. **Supabase-instansen är nere eller otillgänglig**
   - Kontrollera Supabase Dashboard: https://supabase.com/dashboard
   - Verifiera att projektet är aktivt
   - Kontrollera nätverksanslutning

2. **Environment-variabler saknas eller är felaktiga**
   - Kontrollera `.env.local`:
     ```bash
     SUPABASE_URL=din_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=din_service_role_key
     ```
   - Starta om dev-servern efter ändringar

3. **Databas-tabeller saknas**
   - Kör SQL-migrationen: `sql/CREATE_INTEGRATIONS_TABLES.sql`
   - Kör helper-funktioner: `sql/CREATE_INTEGRATION_HELPER_FUNCTIONS.sql`
   - Verifiera i Supabase SQL Editor att tabellerna finns

4. **Nätverksproblem**
   - Kontrollera firewall-inställningar
   - Testa Supabase-anslutning manuellt
   - Kontrollera om VPN eller proxy blockerar anslutningen

### Lösningar

#### Steg 1: Verifiera Supabase-anslutning
```bash
# Testa manuellt i browser console
fetch('https://din-projekt.supabase.co/rest/v1/integrations?select=*', {
  headers: {
    'apikey': 'din_service_role_key',
    'Authorization': 'Bearer din_service_role_key'
  }
})
```

#### Steg 2: Kontrollera environment-variabler
```bash
# I terminalen där dev-servern körs
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### Steg 3: Verifiera databas-tabeller
```sql
-- Kör i Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
AND table_name LIKE 'integration%';
```

#### Steg 4: Testa API-endpoint manuellt
```bash
# Öppna i browser
http://localhost:3000/api/integrations/check-table
```

## Problem: Supabase Auth Timeout

### Symptom
- `ERR_CONNECTION_TIMED_OUT` i console
- `AuthRetryableFetchError: Failed to fetch`
- Användaren loggas ut automatiskt

### Lösningar

1. **Kontrollera Supabase Auth-inställningar**
   - Gå till Supabase Dashboard → Authentication → Settings
   - Verifiera att Site URL är korrekt: `http://localhost:3000`
   - Kontrollera Redirect URLs

2. **Kontrollera nätverksanslutning**
   - Testa att öppna Supabase Dashboard i webbläsaren
   - Kontrollera om andra Supabase-anrop fungerar

3. **Rensa browser cache och cookies**
   - Rensa alla cookies för localhost
   - Rensa localStorage
   - Testa i incognito-läge

4. **Kontrollera environment-variabler**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=din_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=din_anon_key
   ```

## Problem: Kan inte koppla integrationer

### Symptom
- "Anslutning misslyckades" när man klickar på connect-knapp
- OAuth-redirect fungerar inte
- Fortnox/Visma visar felmeddelanden

### Lösningar

1. **Verifiera OAuth-credentials**
   - Fortnox: https://apps.fortnox.se/oauth-v1
   - Visma: https://developer.visma.com/
   - Kontrollera att Redirect URI matchar exakt

2. **Kontrollera environment-variabler**
   ```bash
   FORTNOX_CLIENT_ID=UFg21BcGXfMs
   FORTNOX_CLIENT_SECRET=9r7SqU8WDT
   FORTNOX_REDIRECT_URI=http://localhost:3000/api/integrations/fortnox/callback
   ```

3. **Starta om dev-servern**
   - Environment-variabler laddas bara vid start
   - Tryck Ctrl+C och kör `npm run dev` igen

4. **Kontrollera SQL helper-funktioner**
   - Kör `sql/CREATE_INTEGRATION_HELPER_FUNCTIONS.sql`
   - Verifiera att `create_integration()` funktionen finns

## Debugging-tips

### 1. Aktivera detaljerad logging
```typescript
// I API-routes, lägg till:
console.log('🔍 Debug info:', {
  tenantId,
  integrationId: params.id,
  timestamp: new Date().toISOString()
});
```

### 2. Testa endpoints manuellt
```bash
# Lista integrationer
curl http://localhost:3000/api/integrations

# Hämta status
curl http://localhost:3000/api/integrations/[id]/status

# Kontrollera tabell
curl http://localhost:3000/api/integrations/check-table
```

### 3. Kontrollera browser console
- Öppna Developer Tools (F12)
- Gå till Network-tab
- Filtrera på "integrations"
- Kontrollera status codes och response bodies

### 4. Kontrollera server logs
- Titta i terminalen där `npm run dev` körs
- Sök efter felmeddelanden med "❌" eller "ERROR"
- Kontrollera timeout-meddelanden

## Vanliga felmeddelanden

### "Could not find the table 'public.integrations'"
**Lösning:** Kör SQL-migrationen `CREATE_INTEGRATIONS_TABLES.sql`

### "Tenant ID saknas"
**Lösning:** 
- Kontrollera att du är inloggad
- Verifiera att JWT innehåller `tenant_id` claim
- Kontrollera `/api/tenant/get-tenant`

### "Databasanslutning timeout"
**Lösning:**
- Kontrollera Supabase-instansens status
- Verifiera nätverksanslutning
- Kontrollera firewall-inställningar

### "Invalid client: The client id supplied is invalid"
**Lösning:**
- Verifiera att `FORTNOX_CLIENT_ID` är korrekt i `.env.local`
- Starta om dev-servern
- Kontrollera att inga mellanslag eller citattecken finns

## Ytterligare resurser

- [Supabase Documentation](https://supabase.com/docs)
- [Fortnox API Documentation](https://developer.fortnox.se/)
- [Visma API Documentation](https://developer.visma.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

