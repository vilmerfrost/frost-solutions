import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User, Share2, Linkedin, Twitter, Mail, ArrowRight } from 'lucide-react';

const blogContent: Record<string, {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  content: string;
}> = {
  'rot-automation-sparar-tid': {
    title: 'Varför ROT-automation sparar byggföretag 15 timmar per månad',
    excerpt: 'Manuell ROT-hantering är en tidstjuv. Lär dig hur AI kan automatisera processen.',
    category: 'Product',
    readTime: '5 min',
    date: '15 jan 2025',
    content: `
## Problemet med manuell ROT-hantering

Varje svenskt byggföretag som arbetar med privatpersoner känner till ROT-avdraget. Det är fantastiskt för kunderna, men för företagen innebär det timmar av pappersarbete varje månad.

En typisk ROT-ansökan kräver:
- Detaljerad projektbeskrivning
- Uppdelning av arbets- och materialkostnader
- Korrekt format för Skatteverket
- Dubbelkontroll av alla uppgifter

**I genomsnitt tar varje ROT-ansökan 1,5-2 timmar att slutföra manuellt.**

## Vad betyder detta för ditt företag?

Låt oss räkna på det:
- 5 ROT-jobb per månad × 2 timmar = 10 timmar
- 10 timmar × 500 kr/timme = 5,000 kr i förlorad produktivitet
- Per år: 60,000 kr i dold kostnad

Och detta är bara för ett litet företag. Större företag med 20-30 ROT-jobb per månad förlorar upp till 300,000 kr årligen.

## Hur AI förändrar spelet

Med Frost Byggs ROT-automation matar du in grunddata om projektet - adress, kostnad, arbetstyp - och AI:n genererar en komplett, Skatteverket-godkänd sammanfattning på sekunder.

### Så fungerar det:
1. Fyll i projektinformation (2 minuter)
2. AI analyserar och genererar sammanfattning (10 sekunder)
3. Granska och skicka (1 minut)

**Total tid: 3 minuter istället för 2 timmar.**

## ROI-kalkyl

| Manuellt | Med Frost Bygg |
|----------|----------------|
| 2 tim/ansökan | 3 min/ansökan |
| 60,000 kr/år bortkastade | 5,988 kr/år totalkostnad |
| Hög felrisk | AI-kontrollerat |

## Kom igång idag

Testa Frost Bygg gratis i 30 dagar. Ingen bindningstid, inget kreditkort krävs. Se själv hur mycket tid du kan spara.
    `,
  },
  'bygglet-vs-frost-bygg': {
    title: 'Bygglet vs Frost Bygg: Komplett jämförelse 2025',
    excerpt: 'En detaljerad jämförelse av funktioner, priser och användarupplevelse.',
    category: 'Industry',
    readTime: '7 min',
    date: '12 jan 2025',
    content: `
## Bakgrund

Bygglet har länge varit standardvalet för svenska byggföretag. Men med teknikens utveckling och nya aktörer på marknaden är det dags att ompröva valet.

I denna artikel jämför vi Bygglet och Frost Bygg funktioner för funktion, pris för pris.

## Prissättning

### Bygglet
- Baspris: 1,000-2,000 kr/månad
- Per användare: 200-400 kr/användare/månad
- Setup-avgift: 5,000-15,000 kr
- Utbildning: 2,000-5,000 kr

**För ett företag med 5 användare: ~3,000 kr/månad + engångskostnader**

### Frost Bygg
- Fast pris: 499 kr/månad
- Obegränsade användare: 0 kr extra
- Setup-avgift: 0 kr
- Utbildning: Ingår

**För ett företag med 5 användare: 499 kr/månad. Punkt.**

## Funktioner

| Funktion | Bygglet | Frost Bygg |
|----------|---------|------------|
| ROT-automation | Manuellt | AI-drivet ✅ |
| Faktura-OCR | Manuellt | AI-drivet ✅ |
| Offline-läge | Begränsat | Fullt stöd ✅ |
| Modern UI | 2010-design | 2025-design ✅ |
| Dark mode | Nej | Ja ✅ |
| Uppdateringar | Kvartalsvis | Veckovis ✅ |

## AI-funktioner

Den största skillnaden 2025 är AI. Frost Bygg har byggt AI-automation i kärnan:

- **ROT-sammanfattningar**: Genereras automatiskt
- **Faktura-läsning**: AI extraherar data från PDF:er
- **Projektanalys**: Prediktiva insikter om budget och tidplan

Bygglet erbjuder ingen av dessa funktioner.

## Slutsats

Om du vill ha:
- Lägre kostnad → Frost Bygg
- AI-automation → Frost Bygg
- Modern upplevelse → Frost Bygg
- Offline-stöd → Frost Bygg

Bygglet passar dig som:
- Redan har investerat tungt i deras ekosystem
- Inte behöver AI-funktioner
- Har budget för premium-priser

## Migrera från Bygglet

Vi erbjuder gratis migrationshjälp för Bygglet-kunder. Kontakta oss så hjälper vi dig flytta dina projekt och data.
    `,
  },
  'hur-vi-byggde-frost-bygg': {
    title: 'Hur vi byggde Frost Bygg på 2 veckor',
    excerpt: 'Berättelsen om hur en 18-åring från Ljusdal byggde ett komplett projektverktyg.',
    category: 'Company',
    readTime: '4 min',
    date: '10 jan 2025',
    content: `
## Det började med frustration

2024. Jag satt hemma i Ljusdal och hjälpte ett lokalt byggföretag med deras administration. De betalade 3,000 kr/månad för Bygglet.

Jag tittade på systemet. Det såg ut som något från 2010. Ingen AI. Ingen offline. Klumpigt gränssnitt.

"Varför finns det inget bättre?" frågade jag.

Ingen hade ett bra svar.

## Två veckor av intensivt arbete

Jag bestämde mig för att bygga alternativet själv.

### Vecka 1: Grunden
- Dag 1-2: Projektstruktur och databas
- Dag 3-4: Tidrapportering och användarhantering
- Dag 5-7: ROT-modul med AI-integration

### Vecka 2: Polish och launch
- Dag 8-9: Faktura-OCR med Gemini 2.0
- Dag 10-11: Fortnox/Visma-integrationer
- Dag 12-13: PWA och offline-stöd
- Dag 14: Launch 🚀

## Tech stack

- **Frontend**: React + TypeScript + Tailwind
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini 2.0 Flash + Groq Llama 3.3
- **Hosting**: Vercel (global edge network)

Ingen av dessa teknologier kostar mycket. Totalt ~100 kr/månad i drift.

## Första kunden

Det första byggföretaget som testade Frost Bygg sparade 15 timmar första månaden - bara på ROT-automation.

De betalade 499 kr istället för 3,000 kr. Och fick bättre funktioner.

## Vad jag lärde mig

1. **Stora företag är långsamma** - De kan inte konkurrera med solo-utvecklare på innovation
2. **AI förändrar allt** - Uppgifter som tog timmar tar nu sekunder
3. **Priser är godtyckliga** - Det finns ingen anledning att ta 3,000 kr/månad för något som kostar 100 kr att driva

## Framtiden

Vi är bara i början. BankID, Swish, BIM-integration, röstkommandon - allt kommer.

Målet är att göra svensk byggadministration 10x bättre och 10x billigare.

Häng med på resan.
    `,
  },
  'verkliga-kostnaden-byggprogramvara': {
    title: 'Den verkliga kostnaden av byggprogramvara',
    excerpt: 'Dolda avgifter, setup-kostnader och per-användare-priser.',
    category: 'Industry',
    readTime: '6 min',
    date: '8 jan 2025',
    content: `
## Det de inte berättar på säljmötet

När du utvärderar byggprogramvara får du ofta se ett lockande månadspris. Men sanningen är mer komplex.

## Dolda kostnader i traditionell byggprogramvara

### 1. Setup-avgifter
- Implementering: 5,000-20,000 kr
- Datamigration: 2,000-10,000 kr
- Anpassningar: 3,000-15,000 kr

### 2. Per-användare-priser
- Baspris × antal användare
- Ofta 200-500 kr per person per månad
- 5 användare = 1,000-2,500 kr extra/månad

### 3. Utbildning
- Grundkurs: 2,000-5,000 kr
- Fortsättningskurs: 1,500-3,000 kr
- Nya anställda: 500-1,000 kr per person

### 4. Support
- Standardsupport ingår ofta
- Premium-support: 500-1,500 kr/månad
- Telefonsupport: Extra kostnad

### 5. Uppdateringar
- Vissa leverantörer tar extra för nya versioner
- "Maintenance fee": 10-20% av licenskostnaden årligen

## Ett realistiskt exempel

**Företag: 5 anställda, använder systemet 3 år**

| Kostnad | År 1 | År 2 | År 3 | Totalt |
|---------|------|------|------|--------|
| Licens (2,000 kr/mån) | 24,000 | 24,000 | 24,000 | 72,000 |
| Per användare (5×300 kr) | 18,000 | 18,000 | 18,000 | 54,000 |
| Setup | 15,000 | 0 | 0 | 15,000 |
| Utbildning | 5,000 | 1,000 | 1,000 | 7,000 |
| **Totalt** | **62,000** | **43,000** | **43,000** | **148,000** |

**Det är ~49,000 kr per år i genomsnitt.**

## Frost Byggs modell

| Kostnad | År 1 | År 2 | År 3 | Totalt |
|---------|------|------|------|--------|
| Licens (499 kr/mån) | 5,988 | 5,988 | 5,988 | 17,964 |
| Allt annat | 0 | 0 | 0 | 0 |
| **Totalt** | **5,988** | **5,988** | **5,988** | **17,964** |

**Besparing över 3 år: 130,000 kr**

## Slutsats

Fråga alltid om:
- Total kostnad över 3 år
- Alla avgifter inkluderade
- Vad som händer om du behöver fler användare

Eller välj en leverantör med transparent prissättning från början.
    `,
  },
  'ai-i-byggbranschen-2025': {
    title: 'AI i byggbranschen: Vad som är möjligt 2025',
    excerpt: 'Från ROT-automation till prediktiv analys. Hur AI förändrar byggbranschen.',
    category: 'Industry',
    readTime: '8 min',
    date: '5 jan 2025',
    content: `
## AI-revolutionen kommer till bygget

2024 var året då AI gick från science fiction till verklighet. 2025 är året då byggbranschen börjar dra nytta av det.

## Användningsområden idag

### 1. Dokumenthantering
AI kan läsa, förstå och extrahera information från:
- Fakturor (leverantör, belopp, datum)
- Ritningar (mått, material, specifikationer)
- Kontrakt (villkor, deadlines, klausuler)

**Tidsbesparing: 80-90% jämfört med manuell hantering**

### 2. ROT/RUT-automation
AI genererar kompletta sammanfattningar för Skatteverket baserat på:
- Projektbeskrivning
- Kostnadsfördelning
- Adress och fastighetsinformation

**Tidigare: 2 timmar per ansökan. Nu: 2 minuter.**

### 3. Projektplanering
AI kan analysera historiska projekt och ge:
- Realistiska tidsuppskattningar
- Budgetprognoser
- Resursoptimering

### 4. Kommunikation
AI-assistenter kan:
- Svara på vanliga kundfrågor
- Generera statusrapporter
- Översätta teknisk dokumentation

## Frost Byggs AI-stack

Vi använder två AI-modeller:

### Google Gemini 2.0 Flash
- Multimodal (text + bild)
- Snabb och kostnadseffektiv
- Perfekt för dokumentanalys

### Groq Llama 3.3 70B
- Snabbaste inferenstiden på marknaden
- Bra för textgenerering
- Kostnadseffektiv för stora volymer

**Totalt: 15,900 gratis förfrågningar per dag inkluderat.**

## Vad som kommer

### Q1 2025
- Röstinmatning för tidrapportering
- AI-driven budgetoptimering

### Q2 2025
- Prediktiv analys av projektrisker
- Automatisk resursallokering

### Q3 2025
- BIM-integration med AI-tolkning
- AR-stöd för projektvisualisering

## Hur du kommer igång

1. Börja med dokumentautomation (fakturor, ROT)
2. Expandera till projektplanering
3. Integrera kommunikationsverktyg

Med Frost Bygg får du tillgång till alla dessa AI-funktioner för 499 kr/månad. Ingen extra kostnad för AI.

## Slutsats

AI är inte längre framtiden - det är nutiden. Företag som inte anpassar sig kommer att halka efter.

Boka en demo idag och se hur AI kan transformera ditt byggföretag.
    `,
  },
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? blogContent[slug] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="section-container text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Artikel hittades inte</h1>
            <Link to="/blog">
              <Button variant="frost">Tillbaka till bloggen</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedPosts = Object.entries(blogContent)
    .filter(([s]) => s !== slug)
    .slice(0, 3)
    .map(([s, p]) => ({ slug: s, ...p }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <article className="section-container">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till bloggen
          </Link>

          {/* Header */}
          <header className="max-w-3xl mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {post.readTime} läsning
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {post.title}
            </h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-frost flex items-center justify-center text-primary-foreground font-bold">
                  VF
                </div>
                <div>
                  <p className="font-medium text-foreground">Vilmer Frost</p>
                  <p className="text-sm text-muted-foreground">{post.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Dela på LinkedIn">
                  <Linkedin className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Dela på Twitter">
                  <Twitter className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Dela via email">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="max-w-3xl prose prose-slate dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-accent">
            <div
              className="whitespace-pre-line text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: post.content
                  .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-foreground mt-10 mb-4">$1</h2>')
                  .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-foreground mt-8 mb-3">$1</h3>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                  .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
              }}
            />
          </div>

          {/* CTA */}
          <div className="max-w-3xl mt-12 rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-frost-blue/5 p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Redo att prova Frost Bygg?
            </h3>
            <p className="text-muted-foreground mb-6">
              Starta gratis idag. Första månaden kostar 0 kr.
            </p>
            <Button variant="frost" size="lg" className="group">
              Starta gratis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Related posts */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-foreground mb-8">Relaterade artiklar</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 card-hover"
                >
                  <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent">
                    {p.category}
                  </span>
                  <h4 className="mt-3 font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                    {p.title}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;