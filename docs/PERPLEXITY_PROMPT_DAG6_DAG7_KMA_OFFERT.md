# Perplexity Pro Research Prompt: Dag 6-7 KMA/Offert Implementation

## Research Query

Jag behöver research om hur man implementerar en komplett offert/KMA (Kostnads- och Miljöanalys) funktionalitet i en Next.js 16 + Supabase-applikation. Jag vill ha best practices, tekniska lösningar, och exempel på hur andra företag implementerar detta.

## Specifika Research Areas

### 1. Offert/KMA System Architecture
- Hur strukturerar man ett offert-system i en modern web-applikation?
- Best practices för offert-generering med dynamiska priser och rabatter
- Hur hanterar man offert-versionering och historik?
- Database schema design för offerter (relaterade tabeller: projects, clients, line items, etc.)

### 2. PDF Generation för Offerter
- Bästa bibliotek för PDF-generering i Next.js/React (react-pdf, jsPDF, Puppeteer, etc.)
- Hur skapar man professionella offert-PDF:er med branding och layout?
- Dynamisk PDF-generering med variabel data (priser, produkter, villkor)
- Exempel på offert-templates och designs

### 3. Offert Workflow och Status Management
- Typiska offert-statusar (draft, sent, accepted, rejected, expired)
- Workflow för offert-approval process
- Hur hanterar man offert-expiration och påminnelser?
- Integration med e-post för att skicka offerter till kunder

### 4. Pricing och Calculation Engine
- Hur implementerar man en flexibel pricing engine för offerter?
- Hantering av rabatter, kampanjer, och specialpriser
- Beräkning av moms, skatter, och avgifter
- Multi-currency support för offerter

### 5. Integration med Existing Systems
- Hur integrerar man offerter med projekt-hantering (när offert blir projekt)?
- Integration med fakturering (när offert accepteras → skapa faktura)
- Koppling mellan offerter och time tracking (för att spåra fakturerbara timmar)
- CRM-integration för offert-hantering

### 6. Supabase/PostgreSQL Implementation
- Optimal database schema för offerter i PostgreSQL
- Row Level Security (RLS) policies för offerter
- Efficient queries för offert-listing och filtering
- Storage av offert-PDF:er (Supabase Storage vs. database)

### 7. UI/UX för Offert Management
- Best practices för offert-listing och filtering
- Design patterns för offert creation wizard
- Mobile-responsive offert views
- Real-time collaboration på offerter (om flera användare arbetar på samma offert)

### 8. Legal och Compliance
- Vad måste ingå i en juridisk bindande offert?
- GDPR-compliance för offert-data
- Digital signering av offerter
- Terms and conditions integration

## Teknisk Stack Context

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL), Row Level Security
- **PDF:** React-PDF eller liknande
- **State Management:** React Query (TanStack Query)
- **Existing Features:** Projects, Time Entries, Invoices, Clients, Employees

## Specifika Frågor att Besvara

1. **Database Schema:** Vad är den optimala tabellstrukturen för offerter? Ska line items vara en separat tabell eller JSONB?

2. **PDF Generation:** Vilket bibliotek ger bäst resultat för komplexa offert-layouts med tabeller, bilder, och dynamiskt innehåll?

3. **Versioning:** Hur implementerar man offert-versionering effektivt? Ska varje ändring skapa en ny version eller spara som historik?

4. **Approval Workflow:** Hur bygger man en approval workflow där offerter måste godkännas innan de skickas?

5. **Email Integration:** Bästa sättet att skicka offerter via e-post med tracking (öppnad, klickad, etc.)?

6. **Conversion Tracking:** Hur spårar man när en offert blir ett projekt eller faktura?

7. **Performance:** Hur optimerar man för snabb offert-generering och PDF-export?

8. **Offline Support:** Kan offerter skapas offline och synkas senare? (Vi har redan offline support för time entries)

## Exempel och Case Studies

- Exempel på välfungerande offert-system i SaaS-applikationer
- Case studies från bygg/construction-industrin (eftersom vi är i den branschen)
- Open source offert-system som inspiration
- API-design patterns för offert-endpoints

## Prioritering

Fokusera särskilt på:
1. **Database schema design** - Detta är kritiskt för resten av implementationen
2. **PDF generation** - Användare behöver professionella offerter
3. **Workflow management** - Offert-processen måste vara smidig
4. **Integration points** - Hur offerter kopplas till projekt och fakturor

## Output Format

Ge mig:
- Konkreta kod-exempel där möjligt
- Database schema förslag
- Bibliotek-rekommendationer med för- och nackdelar
- Best practices från industrin
- Potentiella pitfalls att undvika
- Performance considerations

---

**Använd denna prompt i Perplexity Pro för att få omfattande research om offert/KMA-implementation. Perplexity är perfekt för att hitta best practices, tekniska lösningar, och real-world exempel.**

