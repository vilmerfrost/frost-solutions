# 🧪 Test Guide - OCR & Workflow Features

## Översikt
Detta dokument beskriver hur man testar de nya OCR- och Workflow-funktionerna.

---

## 📋 Nya Funktioner

### 1. OCR Dokumentbearbetning
- **Följesedlar**: `/delivery-notes`
- **Leverantörsfakturor**: `/supplier-invoices` (OCR-funktionalitet)

### 2. Arbetsflöden
- **Live Dashboard**: `/workflows`
- **Historik**: `/workflows/history`

### 3. Integrationer
- **Inställningar**: `/settings/integrations`

---

## 🧪 Teststeg

### Test 1: OCR Följesedel

1. **Navigera till Följesedlar**
   - Klicka på "Följesedlar" i sidebaren
   - URL: `http://localhost:3000/delivery-notes`

2. **Ladda upp dokument**
   - Klicka på "Ladda upp följesedel"
   - Dra och släpp en PDF eller bildfil
   - Eller klicka för att välja fil

3. **Verifiera OCR-resultat**
   - Kontrollera att leverantörsnamn extraheras
   - Verifiera att artiklar listas korrekt
   - Kontrollera konfidensnivå (ska vara > 70%)

4. **Granska workflow-status**
   - Kontrollera att workflow visas i "Arbetsflöden"
   - Verifiera att status uppdateras i realtid

### Test 2: OCR Leverantörsfaktura

1. **Navigera till Leverantörsfakturor**
   - Klicka på "Leverantörsfakturor" i sidebaren
   - URL: `http://localhost:3000/supplier-invoices`

2. **Ladda upp faktura**
   - Klicka på "Ladda upp faktura"
   - Välj en faktura-PDF eller bild

3. **Verifiera projektmatchning**
   - Kontrollera att systemet försöker matcha mot projekt
   - Verifiera matchningskonfidens
   - Granska extraherade fakturauppgifter

### Test 3: Arbetsflöden Dashboard

1. **Navigera till Arbetsflöden**
   - Klicka på "Arbetsflöden" i sidebaren
   - URL: `http://localhost:3000/workflows`

2. **Kontrollera aktiva workflows**
   - Verifiera att aktiva workflows visas
   - Kontrollera att status uppdateras i realtid
   - Testa filtrering på filnamn

3. **Kontrollera historik**
   - Navigera till historik-sektionen
   - Verifiera paginering
   - Kontrollera att slutförda workflows visas

### Test 4: Realtidsuppdateringar

1. **Öppna två flikar**
   - Öppna `/workflows` i två separata flikar

2. **Starta ett nytt workflow**
   - Ladda upp ett dokument i en flik

3. **Verifiera synkronisering**
   - Kontrollera att båda flikarna uppdateras automatiskt
   - Verifiera att notifikationer visas

### Test 5: Integrationer

1. **Navigera till Integrationer**
   - Klicka på "Integrationer" i sidebaren
   - URL: `http://localhost:3000/settings/integrations`

2. **Testa anslutning**
   - Klicka på "Anslut" för Fortnox eller Visma
   - Följ OAuth-flödet
   - Verifiera att status uppdateras efter anslutning

---

## ✅ Förväntade Resultat

### OCR Processing
- ✅ Dokument laddas upp korrekt
- ✅ OCR-data extraheras
- ✅ Konfidensnivå visas
- ✅ Workflow-status uppdateras i realtid

### Workflow Management
- ✅ Aktiva workflows visas
- ✅ Status uppdateras automatiskt
- ✅ Notifikationer visas vid statusändringar
- ✅ Historik fungerar med paginering

### Integrationer
- ✅ OAuth-flöde fungerar
- ✅ Status uppdateras efter anslutning
- ✅ UI-refresh fungerar korrekt

---

## 🐛 Kända Problem

### OCR Processing
- **Problem**: AWS Textract och Google DocAI är mockade
- **Lösning**: Konfigurera riktiga credentials i `.env.local`

### Workflow Updates
- **Problem**: Supabase Realtime kräver konfiguration
- **Lösning**: Aktivera Realtime i Supabase Dashboard

---

## 📝 Noteringar

- Alla OCR-komponenter använder svenska texter
- Datum formateras enligt svensk standard (DD.MM.YYYY)
- Belopp formateras med svenska decimaler (1 234,56 SEK)
- WCAG 2.1 AA-kompatibla komponenter används där det är möjligt

---

## 🔧 Utvecklingsmiljö

```bash
# Starta dev server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint
```

---

**Senast uppdaterad**: November 2025

