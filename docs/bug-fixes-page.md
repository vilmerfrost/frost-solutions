# Bug Fixes & Testing Page

## Översikt

En omfattande buggspårnings- och testningssida har skapats för att systematiskt testa och dokumentera buggar i hela appen.

## Plats

**URL:** `/bug-fixes`

Sidan är tillgänglig via:
- Direkt URL: `http://localhost:3001/bug-fixes`
- Via navigationsmenyn: "Bug Fixes" (🐛)

## Funktioner

### 1. Statistik Dashboard
- **Sidor testade:** Visar antal testade sidor vs totalt antal
- **Fungerar korrekt:** Antal sidor som fungerar utan problem
- **Öppna buggar:** Antal aktiva buggar som behöver fixas
- **Fixade buggar:** Antal buggar som har fixats

### 2. Sidlista med Testning
Lista över alla 37 sidor i appen med möjlighet att:
- **Öppna sidan** - Direktlänk till sidan
- **Markera som fungerande** (✓) - Sidan fungerar korrekt
- **Markera som trasig** (✗) - Sidan har problem, öppnar buggformulär

Varje sida visar:
- Status (testad/ej testad, fungerar/trasig)
- Antal buggar kopplade till sidan
- Senaste testdatum

### 3. Buggspårning
#### Rapportera ny bugg
Formulär för att rapportera buggar med följande fält:
- **Sida** (obligatoriskt) - Vilken sida buggen finns på
- **Titel** (obligatoriskt) - Kort beskrivning
- **Beskrivning** (obligatoriskt) - Detaljerad beskrivning
- **Severitet** (obligatoriskt) - Låg, Medel, Hög, Kritisk
- **Steg för att reproducera** - Steg-för-steg instruktioner
- **Förväntat beteende** - Vad borde hända
- **Faktiskt beteende** - Vad händer istället

#### Bugglista
Visar alla rapporterade buggar med:
- **Filter:** Alla statusar, Öppna, eller Fixade
- **Severitetsfilter:** Filtrera på låg, medel, hög, eller kritisk
- **Status:** Öppen, Pågående, Fixad, Stängd
- **Färgkodning:** 
  - Röd = Öppen
  - Gul = Pågående
  - Grön = Fixad
  - Grå = Stängd

#### Buggåtgärder
För varje bugg kan du:
- **Öppna sida** - Gå direkt till sidan där buggen finns
- **Markera som pågående** - Bugg är under arbete
- **Markera som fixad** - Bugg är fixad
- **Stäng** - Stäng fixade buggar
- **Ta bort** - Radera bugg

### 4. Lokal lagring
All data sparas i webbläsarens localStorage:
- Sidstatus (testad, fungerar, senaste testdatum)
- Alla rapporterade buggar
- Buggstatus och historik

**OBS:** Data sparas lokalt i webbläsaren. Om du rensar cache/cookies försvinner datan.

## Användning

### Steg 1: Systematisk testning
1. Gå till `/bug-fixes`
2. Gå igenom varje sida i listan
3. Klicka på "Öppna" för att testa sidan
4. Efter testning:
   - Klicka "✓" om sidan fungerar korrekt
   - Klicka "✗" om sidan har problem (öppnar buggformulär)

### Steg 2: Rapportera buggar
1. Klicka på "✗" för en trasig sida ELLER
2. Klicka på "+ Ny bugg" knappen
3. Fyll i formuläret:
   - Välj sida
   - Skriv en tydlig titel
   - Beskriv problemet i detalj
   - Välj severitet
   - (Valfritt) Lägg till steg för att reproducera
   - (Valfritt) Beskriv förväntat vs faktiskt beteende
4. Klicka "Spara bugg"

### Steg 3: Hantera buggar
1. Använd filter för att hitta specifika buggar
2. Klicka "Öppna sida" för att se buggen i kontext
3. När buggen är fixad, klicka "Markera som fixad"
4. När fixen är verifierad, klicka "Stäng"

## Sidor som ingår

Sidan innehåller alla 37 sidor i appen:
- Dashboard
- Anställda (lista, ny, redigera)
- Projekt (lista, ny, arkiv, detalj)
- Kunder (lista, ny, redigera)
- Offerter (lista, ny, redigera)
- Fakturor (lista, ny, redigera)
- Leverantörsfakturor (lista, ny, redigera, redigera)
- Materialdatabas (lista, ny, redigera)
- Löneexport (perioder, ny, detalj)
- Lönespec
- Rapporter (lista, ny)
- Kalender
- Arbetsordrar
- Analytics
- ROT-avdrag (lista, ny, detalj, överklagande)
- ÄTA
- KMA
- Följesedlar
- Arbetsflöden
- Integrationer
- Utseende
- Feedback
- FAQ
- Admin (huvud, debug, arbetsplatser, live karta, ÄTA admin)
- Login
- Onboarding

## Tekniska detaljer

### Filstruktur
- **Sida:** `app/bug-fixes/page.tsx`
- **Navigering:** Lagt till i `app/components/SidebarClient.tsx`

### Funktioner
- React hooks för state management
- localStorage för persistent lagring
- Toast notifications för feedback
- Responsiv design (mobile, tablet, desktop)
- Dark mode support
- TypeScript för type safety

### Data struktur
```typescript
interface Bug {
  id: string
  page: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'fixed' | 'closed'
  reportedAt: string
  fixedAt?: string
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
}

interface PageStatus {
  path: string
  name: string
  tested: boolean
  working: boolean
  bugs: number
  lastTested?: string
}
```

## Tips för effektiv testning

1. **Testa systematiskt:** Gå igenom sidor i ordning
2. **Var specifik:** Beskriv buggar så detaljerat som möjligt
3. **Inkludera steg:** Steg för att reproducera gör det lättare att fixa
4. **Använd severitet:** Prioritera kritiska buggar först
5. **Uppdatera status:** Markera buggar som fixade när de är fixade
6. **Testa igen:** Efter fixar, testa igen för att verifiera

## Framtida förbättringar

Möjliga utökningar:
- Exportera buggar till CSV/JSON
- Importera buggar från externa källor
- Screenshot-funktionalitet
- Kommentarer på buggar
- Tilldelning av buggar till utvecklare
- Integration med GitHub Issues
- E-postnotifikationer
- Sökfunktion i buggar
- Bulk-åtgärder (markera flera som fixade)

## Support

Om du hittar buggar i buggfix-sidan själv, rapportera dem via:
- Feedback-sidan (`/feedback`)
- Direkt i koden via GitHub Issues
- Eller skapa en bugg om buggfix-sidan i buggfix-sidan! 🐛

