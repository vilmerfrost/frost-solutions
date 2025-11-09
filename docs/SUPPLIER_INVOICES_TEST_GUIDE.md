# Testguide: Leverantörsfakturor System

## 🚀 Snabbstart

### 1. Förberedelser

**Kör SQL-migrationer:**
```sql
-- Kör i Supabase SQL Editor:
-- 1. supplier_invoices.sql (tabeller, triggers, RLS)
-- 2. supplier_invoices_storage.sql (storage bucket)
```

**Skapa Storage Bucket:**
- Gå till Supabase Dashboard → Storage
- Skapa bucket: `supplier_invoices`
- Sätt till privat (public: false)
- Max filstorlek: 10MB
- Tillåtna typer: `application/pdf, image/jpeg, image/png, image/jpg`

**Miljövariabler (valfritt för OCR):**
```env
GOOGLE_VISION_API_KEY=your_key_here  # Om du vill använda Google Vision som fallback
```

---

## 📋 Testscenarier

### Test 1: Skapa Leverantör

1. **Navigera till:** `/supplier-invoices`
2. **Först:** Skapa en leverantör (via API eller direkt i Supabase)
   - Gå till Supabase Dashboard → Table Editor → `suppliers`
   - Lägg till: Name, Org Number (valfritt), Email, Phone
3. **Verifiera:** Leverantören visas i dropdown när du skapar faktura

**Förväntat resultat:** ✅ Leverantör skapad och synlig

---

### Test 2: Skapa Faktura Manuellt

1. **Navigera till:** `/supplier-invoices/new`
2. **Välj tab:** "Manuell Inmatning"
3. **Fyll i:**
   - Leverantör: Välj från dropdown
   - Projekt: Välj projekt (valfritt)
   - Fakturanummer: `LF-2025-001`
   - Fakturadatum: Idag
   - Förfallodatum: Om 30 dagar
4. **Lägg till artiklar:**
   - Klicka "Lägg till artikel"
   - Typ: Material
   - Namn: `Cement`
   - Antal: `20`
   - Enhet: `säck`
   - Pris/enhet: `150`
   - Moms: `25%`
5. **Lägg till fler artiklar:**
   - Typ: Arbetskostnad
   - Namn: `Montering`
   - Antal: `8`
   - Enhet: `tim`
   - Pris/enhet: `450`
6. **Kontrollera totals:**
   - Subtotal: 6,600 SEK
   - Moms: 1,650 SEK
   - Total: 8,250 SEK
7. **Spara:** Klicka "Skapa Faktura"

**Förväntat resultat:** 
- ✅ Faktura skapad
- ✅ Redirect till detaljvy
- ✅ Status: `pending_approval`
- ✅ Totals korrekta

---

### Test 3: Upload & OCR

1. **Navigera till:** `/supplier-invoices/new`
2. **Välj tab:** "Upload & OCR"
3. **Välj leverantör och projekt** (om tillgängligt)
4. **Ladda upp PDF eller bild:**
   - Dra och släpp fil eller klicka "Välj fil"
   - Max 10MB, PDF/JPG/PNG
5. **Klicka:** "Ladda upp & Analysera"
6. **Vänta på OCR-resultat:**
   - Säkerhet visas (0-100%)
   - Om < 70%: Varning visas
   - Om >= 70%: Status blir `pending_approval`, annars `draft`
7. **Klicka:** "Fortsätt till faktura"

**Förväntat resultat:**
- ✅ Fil uppladdad till storage
- ✅ OCR-igenkänning utförd
- ✅ Faktura skapad med extraherade data
- ✅ Redirect till detaljvy

---

### Test 4: Godkänn Faktura (Auto-beräkna Markup)

1. **Navigera till:** Faktura detaljvy (`/supplier-invoices/{id}`)
2. **Kontrollera:** Status är `pending_approval`
3. **Klicka:** "Godkänn" knapp
4. **Bekräfta:** Dialog
5. **Vänta:** Påslag beräknas automatiskt

**Förväntat resultat:**
- ✅ Status ändras till `approved`
- ✅ `markup_total` uppdateras (baserat på markup_rules)
- ✅ Toast: "Faktura godkänd"
- ✅ Historik: "Faktura godkänd" event

**Kontrollera Markup:**
- Gå till Supabase → `markup_rules` tabell
- Skapa regel om inga finns:
  ```sql
  INSERT INTO markup_rules (tenant_id, active, priority, markup_percent)
  VALUES ('your_tenant_id', true, 100, 15);
  ```
- Markup beräknas baserat på regler

---

### Test 5: Registrera Betalning

1. **Navigera till:** Faktura detaljvy (status: `approved` eller `booked`)
2. **Välj tab:** "Betalningar"
3. **Klicka:** "Registrera betalning"
4. **Fyll i:**
   - Belopp: Del av totalbeloppet (t.ex. 4000 SEK)
   - Betalningsdatum: Idag
   - Metod: Bankgiro
   - Noteringar: "Delbetalning"
5. **Spara:** Klicka "Registrera betalning"

**Förväntat resultat:**
- ✅ Betalning registrerad
- ✅ `amount_paid` uppdateras
- ✅ `amount_remaining` beräknas automatiskt
- ✅ Toast: "Betalning registrerad"
- ✅ Betalning visas i tabellen

**Testa full betalning:**
- Registrera betalning för återstående belopp
- Status ändras automatiskt till `paid` om `amount_paid >= amount_total`

---

### Test 6: Konvertera till Kundfaktura

1. **Navigera till:** Faktura detaljvy (status: `approved`)
2. **Kontrollera:** Projekt är kopplat (krävs för konvertering)
3. **Klicka:** "Konvertera till Kundfaktura"
4. **Bekräfta:** Dialog

**Förväntat resultat:**
- ✅ Ny kundfaktura skapad i `invoices` tabell
- ✅ Belopp = `amount_total + markup_total`
- ✅ Redirect till kundfaktura (`/invoices/{id}`)
- ✅ Toast: "Kundfaktura skapad"
- ✅ Historik: "Konverterad till kundfaktura" event

---

### Test 7: Filter & Sökning

1. **Navigera till:** `/supplier-invoices`
2. **Testa filter:**
   - Status: Välj "Godkänd"
   - Leverantör: Välj specifik leverantör
   - Projekt: Välj specifikt projekt
   - Sök: Skriv fakturanummer eller noteringar
3. **Verifiera:** Listan filtreras korrekt
4. **Testa pagination:**
   - Om fler än 20 fakturor: Testa "Nästa" och "Föregående"

**Förväntat resultat:**
- ✅ Filter fungerar korrekt
- ✅ Sökning fungerar
- ✅ Pagination fungerar
- ✅ Antal fakturor visas korrekt

---

### Test 8: Redigera Faktura

1. **Navigera till:** Faktura detaljvy
2. **Klicka:** "Redigera" knapp
3. **Ändra:**
   - Fakturadatum
   - Noteringar
   - Status (om tillåtet)
4. **Spara:** Klicka "Uppdatera Faktura"

**Förväntat resultat:**
- ✅ Ändringar sparas
- ✅ Redirect till detaljvy
- ✅ Toast: "Uppdaterad"
- ✅ Historik: "Faktura uppdaterad" event

---

### Test 9: Arkivera Faktura

1. **Navigera till:** `/supplier-invoices`
2. **Hitta faktura:** Klicka på "..." menyn
3. **Klicka:** "Arkivera"
4. **Bekräfta:** Dialog

**Förväntat resultat:**
- ✅ Status ändras till `archived`
- ✅ Faktura försvinner från normal lista (om filter inte inkluderar archived)
- ✅ Toast: "Faktura arkiverad"
- ✅ Historik: "Faktura arkiverad" event

---

### Test 10: Historik & Audit Trail

1. **Navigera till:** Faktura detaljvy
2. **Välj tab:** "Historik"
3. **Verifiera:** Alla events visas i kronologisk ordning (nyaste först)

**Förväntat resultat:**
- ✅ Alla events visas (created, updated, approved, paid, etc.)
- ✅ Timestamp korrekt
- ✅ Event data visas (om tillgängligt)
- ✅ Ikoner och färger korrekta

---

### Test 11: Responsive Design

1. **Öppna:** DevTools → Toggle device toolbar
2. **Testa:** Mobile (375px), Tablet (768px), Desktop (1920px)
3. **Navigera:** Genom alla sidor och komponenter

**Förväntat resultat:**
- ✅ Layout anpassar sig korrekt
- ✅ Tabell → Cards på mobile
- ✅ Filter → Collapsible drawer på mobile
- ✅ Alla knappar och formulär fungerar

---

### Test 12: Dark Mode

1. **Aktivera:** Dark mode (via sidebar eller settings)
2. **Navigera:** Genom alla sidor

**Förväntat resultat:**
- ✅ Alla komponenter har dark mode support
- ✅ Text är läsbar
- ✅ Kontraster är korrekta
- ✅ Gradients och shadows ser bra ut

---

## 🐛 Vanliga Problem & Lösningar

### Problem: "Kunde inte hämta leverantörsfakturor"
**Lösning:**
- Kontrollera att du är inloggad
- Kontrollera att `tenant_id` är korrekt
- Kontrollera RLS policies i Supabase

### Problem: OCR returnerar låg säkerhet
**Lösning:**
- Använd tydlig PDF eller högupplöst bild
- Kontrollera att fakturan är rättvänd
- Överväg Google Vision API för bättre resultat

### Problem: Markup beräknas inte
**Lösning:**
- Kontrollera att `markup_rules` finns i databasen
- Kontrollera att faktura har `project_id` (om regel kräver det)
- Kontrollera att regel är `active = true`

### Problem: "Faktura hittades inte"
**Lösning:**
- Kontrollera att faktura-ID är korrekt
- Kontrollera att faktura tillhör din tenant
- Kontrollera RLS policies

### Problem: Betalning registreras inte
**Lösning:**
- Kontrollera att belopp <= `amount_remaining`
- Kontrollera att faktura-status tillåter betalning
- Kontrollera att datum är korrekt format

---

## ✅ Checklista

- [ ] SQL migration kördes
- [ ] Storage bucket skapad
- [ ] Leverantör skapad
- [ ] Faktura skapad (manuellt)
- [ ] Faktura skapad (OCR)
- [ ] Faktura godkänd
- [ ] Markup beräknas korrekt
- [ ] Betalning registrerad
- [ ] Faktura konverterad till kundfaktura
- [ ] Filter fungerar
- [ ] Sökning fungerar
- [ ] Redigering fungerar
- [ ] Arkivering fungerar
- [ ] Historik visas korrekt
- [ ] Responsive design fungerar
- [ ] Dark mode fungerar

---

## 📊 Performance Tips

1. **Pagination:** Använd alltid pagination för stora listor
2. **Caching:** React Query cachar data i 5 minuter
3. **Lazy Loading:** History laddas separat för bättre prestanda
4. **Storage:** PDF-filer komprimeras automatiskt av Supabase

---

## 🎉 Klart!

Om alla tester passerar är systemet redo för produktion! 🚀

