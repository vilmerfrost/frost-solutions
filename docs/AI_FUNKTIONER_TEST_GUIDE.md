# 🧪 Guide: Var testa AI-funktionerna

## 📍 Var hittar du AI-funktionerna?

### 1. **AI Budgetprognos** 💰
**Var:** `/projects/[id]` - Projekt-detaljsidan

**Vad den gör:**
- Analyserar projektets budget och framsteg
- Predikterar risk för budgetöverskridning
- Föreslår åtgärder

**Hur testa:**
1. Gå till ett projekt (t.ex. `/projects/[projekt-id]`)
2. Scrolla ner till "AI Budgetprognos" kortet
3. Klicka på "Kör prognos"
4. Se risk-nivå (grön/gul/röd) och föreslagna åtgärder

---

### 2. **AI Materialidentifiering** 📸
**Var:** `/projects/[id]` - Projekt-detaljsidan

**Vad den gör:**
- Identifierar material från foto
- Matchar mot supplier_items i databasen
- Visar confidence score

**Hur testa:**
1. Gå till ett projekt (t.ex. `/projects/[projekt-id]`)
2. Scrolla ner till "AI Materialidentifiering" kortet
3. Dra och släpp en bild eller klicka för att välja
4. Se identifierat material med confidence score

---

### 3. **AI Faktureringsförslag** 📝
**Var:** `/invoices/new?projectId=[id]` - Faktura-skapande sidan

**Vad den gör:**
- Analyserar time entries för projektet
- Föreslår faktura-belopp och rader
- Kan använda Claude AI (betalt) eller template (gratis)

**Hur testa:**
1. Gå till ett projekt
2. Klicka på "📝 Skapa faktura" i fakturerings-sektionen
3. På faktura-skapande sidan ser du "AI Fakturaunderlag" kortet
4. Klicka på "Generera förslag"
5. Se föreslagna faktura-rader och totalt belopp
6. Klicka "Använd förslag" för att auto-fylla formuläret

---

### 4. **AI Projektplanering** 📅
**Var:** `/projects/new` - Projekt-skapande sidan

**Vad den gör:**
- Analyserar historiska projekt
- Föreslår realistisk tidsplan med faser
- Identifierar riskfaktorer

**Hur testa:**
1. Gå till `/projects/new`
2. Fyll i projektnamn och välj kund
3. "AI Projektplan" kortet visas automatiskt
4. Klicka på "Generera plan"
5. Se föreslagna faser, totala dagar, och riskfaktorer

---

### 5. **AI KMA-förslag** ✅
**Var:** `/projects/new` - Projekt-skapande sidan

**Vad den gör:**
- Genererar checklista baserat på projekttyp
- Föreslår KMA-items med foto-krav
- Template-baserat (gratis)

**Hur testa:**
1. Gå till `/projects/new`
2. Fyll i projektnamn (t.ex. "Elektriker Villa Ekbacken")
3. "AI Checklista (KMA)" kortet visas automatiskt
4. Se föreslagna checklista-items
5. Välj items du vill inkludera
6. Klicka "Använd valda" för att skapa checklistan

---

### 6. **AI Sammanfattning** 📄
**Var:** 
- `/projects/[id]` - Projekt-detaljsidan
- `/invoices/[id]` - Faktura-detaljsidan

**Vad den gör:**
- Genererar sammanfattning av projekt eller faktura
- Använder Hugging Face (gratis)

**Hur testa:**
1. Gå till ett projekt eller faktura
2. Scrolla ner till "AI-sammanfattning" kortet
3. Klicka på "Generera"
4. Se AI-genererad sammanfattning

---

## 🎯 Snabb-test guide

### Testa alla AI-funktioner på 5 minuter:

1. **Budgetprognos:**
   - Gå till `/projects/[valfritt-projekt-id]`
   - Scrolla ner → "AI Budgetprognos" → "Kör prognos"

2. **Materialidentifiering:**
   - Samma sida → "AI Materialidentifiering"
   - Ladda upp en bild av byggmaterial

3. **Faktureringsförslag:**
   - Samma projekt → "📝 Skapa faktura"
   - På faktura-sidan → "AI Fakturaunderlag" → "Generera förslag"

4. **Projektplanering:**
   - Gå till `/projects/new`
   - Fyll i namn och kund → "AI Projektplan" → "Generera plan"

5. **KMA-förslag:**
   - Samma sida → "AI Checklista (KMA)"
   - Se automatiskt genererad checklista

6. **Sammanfattning:**
   - Gå tillbaka till projekt → "AI-sammanfattning" → "Generera"

---

## ⚠️ Troubleshooting

### "Kunde inte generera förslag"
- Kontrollera att API-nycklarna är satta i `.env.local`
- För Claude: `ANTHROPIC_API_KEY=sk-ant-...`
- För Hugging Face: `HUGGING_FACE_API_KEY=hf_...`

### "Rate limit uppnådd"
- Vänta 1 minut och försök igen
- Rate limit: 5 requests/min för fakturering, 3 requests/min för projektplanering

### "Cache" badge visas
- Detta är bra! Resultatet hämtades från cache (snabbare och gratis)

### Materialidentifiering fungerar inte
- Kontrollera att bilden är i format: JPEG, JPG, eller PNG
- Försök med en tydlig bild av materialet

---

## 📊 Kostnad

**Gratis:**
- ✅ Budgetprognos (statistisk analys)
- ✅ Materialidentifiering (Hugging Face free tier)
- ✅ KMA-förslag (template-baserat)
- ✅ Sammanfattning (Hugging Face free tier)

**Betalt (optimerat med caching):**
- 💰 Faktureringsförslag (Claude Haiku ~$0.40/100)
- 💰 Projektplanering (Claude Haiku/Sonnet ~$0.80-3.00/100)

**Total kostnad:** Max $50-80/månad för 100 projekt

---

## 🎉 Klart!

Nu vet du var alla AI-funktioner finns och hur du testar dem!

