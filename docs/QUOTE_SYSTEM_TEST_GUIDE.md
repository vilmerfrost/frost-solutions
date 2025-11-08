# Quote/KMA System - Test Guide

## 🚀 Snabb Test Guide

### 1. **Lista Offerter**
- Gå till `/quotes`
- Verifiera att offerter visas i tabell
- Testa filter: Status, Kund, Sök
- Testa pagination (om >20 offerter)
- Testa actions dropdown: Visa, Redigera, Duplicera, Radera

### 2. **Skapa Ny Offert**
- Klicka "Ny Offert"
- Fyll i:
  - Titel (obligatorisk)
  - Kund (obligatorisk)
  - Giltig till (obligatorisk)
  - Valuta (default SEK)
  - KMA aktiverad (checkbox)
  - Anteckningar
- Klicka "Skapa Offert"
- Verifiera redirect till edit-sidan

### 3. **Lägg Till Artiklar**
- På edit-sidan, scrolla ner till "Artiklar"
- Klicka "Lägg till artikel"
- Fyll i:
  - Namn (obligatorisk)
  - Antal
  - Enhet (st, m, tim, etc.)
  - Pris/enhet
  - Rabatt %
  - Moms % (default 25)
  - Typ (Material/Arbete/Övrigt)
- Klicka "Spara"
- Verifiera att artikel visas i tabell
- Verifiera att totals uppdateras automatiskt (Subtotal, Rabatt, Moms, Total)

### 4. **Redigera Artikel**
- Klicka redigera-ikonen på en artikel
- Ändra värden
- Klicka spara-ikonen
- Verifiera att totals uppdateras

### 5. **Radera Artikel**
- Klicka radera-ikonen på en artikel
- Bekräfta i dialog
- Verifiera att artikel försvinner
- Verifiera att totals uppdateras

### 6. **Visa Offert**
- Gå till `/quotes/{id}`
- Verifiera att all information visas:
  - Offertnummer, Titel, Status
  - Kund, Projekt
  - Skapad datum, Giltig till
  - Artiklar lista
  - Totals (Subtotal, Rabatt, Moms, Total)

### 7. **Skicka Email**
- På detail-sidan, klicka "Skicka via Email"
- Fyll i email-adress
- Klicka "Skicka"
- Verifiera toast notification
- Verifiera att status ändras till "sent"

### 8. **Ladda ner PDF**
- Klicka "Ladda ner PDF"
- Verifiera att PDF öppnas i ny flik
- Verifiera att PDF innehåller korrekt information

### 9. **Godkänn Offert**
- Ändra offert status till "pending_approval" (via edit eller direkt i DB)
- På detail-sidan, klicka "Godkänn"
- Lägg till kommentar (valfritt)
- Klicka "Godkänn"
- Verifiera att status ändras till "approved"

### 10. **Konvertera till Projekt**
- Ändra offert status till "accepted" (via edit eller direkt i DB)
- På detail-sidan, klicka "Konvertera till Projekt"
- Bekräfta i dialog
- Verifiera redirect till `/projects/{projectId}`
- Verifiera att projekt skapats med korrekt namn och kund

### 11. **Duplicera Offert**
- På detail-sidan eller i listan, klicka "Duplicera"
- Verifiera redirect till edit-sidan för ny offert
- Verifiera att offertnummer är nytt
- Verifiera att alla artiklar är kopierade
- Verifiera att status är "draft"

### 12. **Material Picker** (Om backend route finns)
- På edit-sidan, klicka "Välj från materialdatabas"
- Sök efter material
- Klicka "Välj" på ett material
- Verifiera att formuläret fylls i automatiskt

### 13. **Template Picker** (Om backend route finns)
- På edit-sidan, välj en template
- Verifiera att artiklar läggs till från template

## ⚠️ Kända Begränsningar

- **Templates API**: Backend routes finns inte ännu (`/api/quote-templates`)
- **Materials API**: Backend routes finns inte ännu (`/api/materials`)
- Dessa funktioner kommer att fungera när backend routes är implementerade

## 🐛 Felsökning

### Totals visar 0
- Backend beräknar totals automatiskt via triggers
- Efter att lägga till/uppdatera artikel, vänta 1-2 sekunder
- Refresh sidan om totals inte uppdateras

### Email skickas inte
- Kolla att `RESEND_API_KEY` är satt i `.env.local`
- Kolla browser console för felmeddelanden

### PDF genereras inte
- Kolla att `@react-pdf/renderer` är installerat
- Kolla browser console för felmeddelanden

### Status transitions fungerar inte
- Backend validerar transitions med `canTransition()`
- Vissa transitions är inte tillåtna (t.ex. draft -> accepted)
- Kolla backend logs för felmeddelanden

## ✅ Checklista

- [ ] Lista offerter fungerar
- [ ] Skapa offert fungerar
- [ ] Redigera offert fungerar
- [ ] Lägg till artikel fungerar
- [ ] Redigera artikel fungerar
- [ ] Radera artikel fungerar
- [ ] Totals uppdateras korrekt
- [ ] Skicka email fungerar
- [ ] PDF download fungerar
- [ ] Godkänn fungerar
- [ ] Konvertera till projekt fungerar
- [ ] Duplicera fungerar
- [ ] Filter fungerar
- [ ] Pagination fungerar
- [ ] Responsive design fungerar på mobile

