# Payroll Export - Snabb Testguide

## 🚀 Snabbstart

### 1. Navigera till Löneexport
- Klicka på "Löneexport" i sidebaren (💰 ikon)
- Du ska se listan över löneperioder (tom första gången)

### 2. Skapa en ny period
- Klicka på "Ny Period" knappen
- Fyll i:
  - **Startdatum**: Välj ett datum (t.ex. 2025-01-01)
  - **Slutdatum**: Välj ett datum efter startdatum (t.ex. 2025-01-31)
  - **Exportformat**: Välj "Fortnox PAXml" eller "Visma CSV"
- Klicka "Skapa period"
- ✅ Du ska redirectas till period detail-sidan

### 3. Lås perioden
- På period detail-sidan, klicka på "Lås Period" knappen
- ⚠️ Om det finns valideringsfel:
  - Du ska se felmeddelanden i "Validering" tabben
  - Vanliga fel:
    - "X tider ej godkända" → Godkänn tidrapporter först
    - "Extern löne-ID saknas" → Lägg till Fortnox/Visma ID på anställda
- ✅ Om allt är OK: Perioden blir låst (status ändras till "Låst")

### 4. Exportera perioden
- Gå till "Export" tabben
- Klicka på "Exportera period" knappen
- ✅ Efter lyckad export:
  - En nedladdningslänk öppnas automatiskt i ny flik
  - Period status ändras till "Exporterad"
  - Filen laddas ner (PAXml eller CSV beroende på format)

### 5. Testa filters
- Gå tillbaka till listan (`/payroll/periods`)
- Testa filters:
  - **Status**: Välj "Låst" eller "Exporterad"
  - **Start datum**: Välj ett datum
  - **Slut datum**: Välj ett datum
- ✅ Listan filtreras korrekt

### 6. Testa unlock (Admin)
- På en låst/exported period, klicka på menyn (⋮) → "Lås upp (Admin)"
- ✅ Perioden blir öppen igen (status = "Öppen")

## ✅ Checklista

- [ ] Kan navigera till Löneexport från sidebar
- [ ] Kan skapa ny period med start/slut datum och format
- [ ] Kan se period i listan
- [ ] Kan öppna period detail-sidan
- [ ] Kan låsa period (om inga valideringsfel)
- [ ] Ser valideringsfel om tidrapporter inte är godkända
- [ ] Kan exportera låst period
- [ ] Fil laddas ner automatiskt efter export
- [ ] Kan filtrera perioder efter status/datum
- [ ] Kan låsa upp period (admin)

## 🐛 Vanliga problem

### "Period hittades inte"
- Kontrollera att period-ID:t är korrekt i URL:en
- Kontrollera att du är inloggad och har rätt tenant

### "Kunde inte låsa period"
- Kontrollera att alla tidrapporter för perioden är godkända
- Kontrollera att anställda har externa löne-ID:n (Fortnox/Visma)

### "Export misslyckades"
- Kontrollera att perioden är låst
- Kontrollera att det finns tidrapporter i perioden
- Kontrollera Supabase Storage bucket `payroll_exports` är skapad

### Filen laddas inte ner
- Kontrollera popup-blockerare i webbläsaren
- Kontrollera att signed URL är giltig (giltig i 10 minuter)

## 📝 Testdata

För att testa med riktig data:
1. Skapa tidrapporter för perioden (via `/reports/new`)
2. Godkänn tidrapporterna (via `/reports` eller admin)
3. Lägg till externa löne-ID:n på anställda:
   - Öppna `/employees/[id]`
   - Lägg till `external_ids.fortnox_id` eller `external_ids.visma_id` i JSONB-fältet

## 🎯 Nästa steg

Efter att ha testat grundfunktionaliteten:
- Testa med riktiga Fortnox/Visma integrationer
- Verifiera att PAXml/CSV filerna är korrekt formaterade
- Testa med stora perioder (många tidrapporter)
- Testa error handling (nätverksfel, ogiltiga data, etc.)

