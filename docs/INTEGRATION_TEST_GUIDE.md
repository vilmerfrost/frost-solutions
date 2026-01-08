# Test Guide: Fortnox/Visma Integration

## Översikt
Denna guide beskriver hur du testar de nya integrationerna för Fortnox och Visma bokföringssystem.

## Förutsättningar
- Du har konfigurerat `FORTNOX_CLIENT_ID`, `FORTNOX_CLIENT_SECRET`, `VISMA_CLIENT_ID`, `VISMA_CLIENT_SECRET` i `.env.local`
- Du har kört SQL-migrationerna för `accounting_integrations` och `sync_logs` tabellerna
- Du är inloggad som admin/användare med tenant_id

## 1. Testa OAuth-anslutning

### Fortnox
1. Gå till `/integrations`
2. Klicka på "Anslut Fortnox" på Fortnox-kortet
3. Du omdirigeras till Fortnox OAuth-sidan
4. Logga in och godkänn behörigheter
5. Du omdirigeras tillbaka till `/integrations?success=true&provider=fortnox`
6. Verifiera att Fortnox-kortet visar status "Ansluten"

### Visma
1. Upprepa samma steg för Visma-kortet
2. Verifiera att båda integrationerna kan vara anslutna samtidigt

## 2. Testa synkronisering av faktura

### Från fakturasidan
1. Gå till `/invoices`
2. Välj en faktura
3. Klicka på "Synka faktura"-knappen (om den finns)
4. Välj Fortnox eller Visma
5. Verifiera att en toast-notifikation visas med "Faktura synkad!"
6. Kontrollera i `/integrations` att en ny loggpost skapats i "Synkroniseringsloggar"

### Från API direkt
```bash
curl -X POST http://localhost:3000/api/integrations/sync-invoice \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "YOUR_INVOICE_ID", "provider": "fortnox"}'
```

## 3. Testa synkronisering av kund

### Från kundsidan
1. Gå till `/clients`
2. Välj en kund
3. Klicka på "Synka kund"-knappen (om den finns)
4. Välj Fortnox eller Visma
5. Verifiera att en toast-notifikation visas
6. Kontrollera i `/integrations` att en ny loggpost skapats

## 4. Testa Analytics Dashboard

1. Gå till `/integrations`
2. Scrolla ner till "Analytics"-sektionen
3. Verifiera att följande visas:
   - **Övergripande mätvärden**: Totalt synkningar, Framgångsgrad, Lyckade, Genomsnittlig tid
   - **Timeline Chart**: Synkronisering över tid (lyckade vs misslyckade)
   - **Framgångsgrad Chart**: Procent lyckade per dag
   - **Varaktighet Chart**: Genomsnittlig synkroniseringstid per dag
   - **Operation Breakdown**: Fördelning per operationstyp (sync_invoice, sync_customer, etc.)
   - **Provider Breakdown**: Fördelning per provider (Fortnox vs Visma)
   - **Resource Breakdown**: Fördelning per resurstyp (invoice, customer)

4. Testa att ändra tidsperiod (7, 30, 90 dagar) i dropdown-menyn

## 5. Testa Sync Logs Table

1. Gå till `/integrations`
2. Scrolla ner till "Synkroniseringsloggar"
3. Verifiera att:
   - Loggar visas i kronologisk ordning (nyaste först)
   - Status-badges visas korrekt (Lyckad, Misslyckad, Väntande)
   - Du kan expandera loggar för att se detaljer
   - Du kan filtrera på status (Alla, Lyckade, Misslyckade, Väntande)

## 6. Testa frånkoppling

1. Gå till `/integrations`
2. Klicka på "Koppla från" på ett anslutet kort
3. Bekräfta i dialogrutan
4. Verifiera att:
   - Integrationen visas som frånkopplad
   - Status ändras till "Ej ansluten"
   - "Anslut"-knappen visas igen

## 7. Testa Status Card

1. Verifiera att "Synkroniseringsstatus"-kortet visar:
   - Totalt antal operationer
   - Antal lyckade (med procent)
   - Antal misslyckade (med procent)
   - Antal väntande

## 8. Testa Real-time Updates

1. Öppna `/integrations` i två flikar
2. I en flik, synka en faktura eller kund
3. Verifiera att den andra fliken uppdateras automatiskt inom 30 sekunder
4. Verifiera att analytics uppdateras inom 5 minuter

## 9. Testa Error Handling

### Testa med ogiltig faktura-ID
```bash
curl -X POST http://localhost:3000/api/integrations/sync-invoice \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "invalid-id", "provider": "fortnox"}'
```
Verifiera att ett felmeddelande visas.

### Testa utan ansluten integration
1. Koppla från alla integrationer
2. Försök synka en faktura
3. Verifiera att ett felmeddelande visas: "Ingen integration"

## 10. Testa Token Refresh

1. Vänta tills access token går ut (eller ändra `expires_at` manuellt i databasen)
2. Försök synka en faktura
3. Verifiera att token automatiskt uppdateras och synkroniseringen fortsätter

## Felsökning

### Integration visas inte som ansluten
- Kontrollera `accounting_integrations` tabellen i Supabase
- Verifiera att `status = 'active'`
- Kontrollera att tokens finns i `metadata` kolumnen

### Synkronisering misslyckas
- Kontrollera konsolen för felmeddelanden
- Verifiera att OAuth-tokens är giltiga
- Kontrollera `sync_logs` tabellen för detaljerade felmeddelanden

### Analytics visar inga data
- Verifiera att det finns loggar i `sync_logs` tabellen
- Kontrollera att `created_at` är inom den valda tidsperioden
- Kontrollera konsolen för API-fel

## Nästa steg

Efter att ha testat grundfunktionaliteten kan du:
1. Testa batch-synkronisering (flera fakturor/kunder samtidigt)
2. Testa konfliktlösning när data ändras i båda systemen
3. Testa webhook-integrationer (för Visma)
4. Testa rate limiting och retry-logik

