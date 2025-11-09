# 🔍 Research Prompt: Prioritet 2 Funktioner (EDI, OCR, Formulär)

## Research Request för Perplexity

Jag behöver research om tre funktioner för ett svenskt byggföretags-projektmanagementsystem (Next.js 16, TypeScript, Supabase):

---

## 1. EDI Orderbekräftelse med OCR för Följesedlar

### Kontext
- System: Next.js 16 + TypeScript + Supabase
- Användning: Byggföretag behöver automatiskt registrera artiklar från följesedlar
- Mål: OCR av följesedlar → Extrahera artiklar → Auto-registrera i materialdatabas

### Research Questions:
1. **OCR-teknologier för svenska följesedlar:**
   - Vilka OCR-API:er fungerar bäst för svenska dokument? (Tesseract, Google Vision, AWS Textract, Azure Form Recognizer)
   - Specifika bibliotek för följesedlar (leverantörsspecifika format)?
   - Kostnad och prestanda-jämförelse?

2. **EDI-standarder i Sverige:**
   - Vilka EDI-standarder används för orderbekräftelse i Sverige? (EDIFACT, PEPPOL, etc.)
   - Specifika format för byggbranschen?
   - Exempel på EDI-filer för orderbekräftelse?

3. **Strukturering av OCR-data:**
   - Hur extraherar man strukturerad data från följesedlar? (artikelnummer, kvantitet, pris, leverantör)
   - Machine learning-modeller för dokumentförståelse?
   - Best practices för validering av extraherad data?

4. **Auto-artikelregistrering:**
   - Workflow: OCR → Parsing → Validering → Database insert
   - Hantering av duplicerade artiklar?
   - Matchning mot befintlig materialdatabas?

5. **Teknisk implementation:**
   - Serverless functions för OCR-processing?
   - Queue-system för batch-processing?
   - Error handling och retry-logik?

---

## 2. OCR för Fakturor med Auto-matchning mot Projekt

### Kontext
- System: Next.js 16 + TypeScript + Supabase
- Användning: Byggföretag får leverantörsfakturor som ska kopplas till projekt
- Mål: OCR av fakturor → Extrahera data → Auto-matcha mot projekt → Skapa fakturapost

### Research Questions:
1. **OCR för svenska fakturor:**
   - Bästa OCR-API:er för fakturor? (Google Document AI, AWS Textract, Azure Form Recognizer)
   - Specifika templates för svenska fakturaformat?
   - Hantering av olika fakturaformat (PDF, bilder, skannade)?

2. **Faktura-data extraction:**
   - Vilka fält behöver extraheras? (leverantör, belopp, datum, OCR-nummer, projektreferens)
   - Machine learning för att identifiera fakturafält?
   - Validering av extraherad data (belopp, datum, etc.)?

3. **Auto-matchning mot projekt:**
   - Algoritmer för att matcha fakturor till projekt? (leverantörsnamn, projektreferens, datum, belopp)
   - Fuzzy matching för leverantörsnamn?
   - Confidence scoring för matchningar?

4. **Workflow och UI:**
   - Upload → OCR → Review → Approve → Create invoice
   - UI för att granska och korrigera OCR-resultat?
   - Batch-processing av flera fakturor?

5. **Teknisk implementation:**
   - File upload till Supabase Storage → Trigger OCR → Process → Store
   - Background jobs för OCR-processing?
   - Webhooks för OCR-completion?

---

## 3. Förbättra Formulärsystem (Fler Mallar, Bättre UI)

### Kontext
- System: Next.js 16 + TypeScript + Supabase
- Nuvarande: Grundläggande formulär med React-hooks
- Mål: Formulärbyggare med mallar, bättre UX, validering

### Research Questions:
1. **Formulärbyggare-bibliotek:**
   - Bästa React-formulärbibliotek för komplexa formulär? (React Hook Form, Formik, React Final Form)
   - Drag-and-drop formulärbyggare? (FormBuilder, React Form Builder)
   - Kostnadsfria vs betalda alternativ?

2. **Formulärmallar för byggbranschen:**
   - Vanliga formulärtyper i byggbranschen? (säkerhetskontroll, kvalitetskontroll, leveransbekräftelse, etc.)
   - Exempel på formulärmallar?
   - Conditional logic (visa/dölj fält baserat på svar)?

3. **UI/UX best practices:**
   - Modern formulärdesign (2024-2025)?
   - Mobile-first formulärdesign?
   - Progress indicators för långa formulär?
   - Auto-save funktionalitet?

4. **Validering och datahantering:**
   - Client-side vs server-side validering?
   - Real-time validering?
   - Schema-validering (Zod, Yup)?
   - Error handling och felmeddelanden?

5. **Teknisk implementation:**
   - Formulär-schema i database (JSON)?
   - Versionering av formulärmallar?
   - Export/import av formulärmallar?
   - Integration med Supabase för data storage?

6. **Advanced features:**
   - File uploads i formulär?
   - Signering av formulär (BankID)?
   - Offline-stöd för formulär?
   - PDF-generering av ifyllda formulär?

---

## Ytterligare Research Areas:

### Integration mellan funktionerna:
- Hur kan OCR-data användas för att auto-fylla formulär?
- Koppling mellan följesedlar och fakturor?
- Workflow: Följesedel → Artikelregistrering → Projektkoppling → Fakturering?

### Svenska specifika krav:
- GDPR-compliance för OCR-processing?
- Lagkrav för dokumenthantering i byggbranschen?
- Svenska fakturastandarder (SIE, PEPPOL)?

### Prestanda och skalning:
- Caching av OCR-resultat?
- Batch-processing av dokument?
- Rate limiting för OCR-API:er?

---

## Önskat Output Format:

För varje funktion, ge:
1. **Rekommenderad teknisk stack** (bibliotek, API:er, verktyg)
2. **Implementation approach** (steg-för-steg)
3. **Kostnadsuppskattning** (API-kostnader, hosting)
4. **Code examples** (TypeScript/React)
5. **Best practices** och vanliga pitfalls
6. **Alternativ** (om det finns billigare/enklare sätt)

---

## Prioritering:
- **EDI Orderbekräftelse:** Hög prioritet (2-3 dagar estimerad tid)
- **OCR Fakturor:** Hög prioritet (2-3 dagar estimerad tid)
- **Formulärförbättringar:** Medel prioritet (1-2 dagar estimerad tid)

---

**Tack för din research! 🚀**

