import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Check, Hammer, Calendar, Rocket } from 'lucide-react';

const changelogItems = [
  {
    status: 'shipped',
    date: 'Jan 2025',
    title: 'ROT AI Automation',
    description: 'Automatisk generering av ROT-sammanfattningar med AI. Spara 10+ timmar per månad på pappersarbete.',
  },
  {
    status: 'shipped',
    date: 'Jan 2025',
    title: 'Offline-First PWA',
    description: 'Full funktionalitet utan internet. Synkas automatiskt när du får uppkoppling igen.',
  },
  {
    status: 'shipped',
    date: 'Jan 2025',
    title: 'Invoice OCR (Gemini 2.0)',
    description: 'AI läser fakturor på sekunder. Extraherar leverantör, belopp, datum och radposter automatiskt.',
  },
  {
    status: 'shipped',
    date: 'Dec 2024',
    title: 'Fortnox Integration',
    description: 'Exportera löner och bokföring direkt till Fortnox med ett klick.',
  },
  {
    status: 'shipped',
    date: 'Dec 2024',
    title: 'Visma Integration',
    description: 'Sömlös koppling till Visma eEkonomi för automatisk synkronisering.',
  },
  {
    status: 'shipped',
    date: 'Dec 2024',
    title: 'Dark Mode',
    description: 'Professionellt mörkt tema för bekvämt arbete dygnet runt.',
  },
  {
    status: 'in-progress',
    date: 'Feb 2025',
    title: 'BankID Login',
    description: 'Säker inloggning med BankID för enkel och trygg autentisering.',
  },
  {
    status: 'in-progress',
    date: 'Feb 2025',
    title: 'Advanced Analytics',
    description: 'AI-drivna insikter om dina projekt med prediktiva analyser och rapporter.',
  },
  {
    status: 'roadmap',
    date: 'Mar 2025',
    title: 'Swish Payments',
    description: 'Betala fakturor direkt med Swish. Snabbt, enkelt och säkert.',
  },
  {
    status: 'roadmap',
    date: 'Mar 2025',
    title: 'iOS/Android Apps',
    description: 'Native mobilappar för ännu bättre upplevelse på byggplatsen.',
  },
  {
    status: 'roadmap',
    date: 'Apr 2025',
    title: 'BIM Integration',
    description: 'Koppling till BIM-modeller för visualisering och projektplanering.',
  },
  {
    status: 'roadmap',
    date: 'Q2 2025',
    title: 'Voice Commands',
    description: 'Rapportera tid och uppdatera projekt med röstkommandon.',
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'shipped':
      return <Check className="h-5 w-5" />;
    case 'in-progress':
      return <Hammer className="h-5 w-5" />;
    case 'roadmap':
      return <Calendar className="h-5 w-5" />;
    default:
      return <Check className="h-5 w-5" />;
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'shipped':
      return 'bg-success/10 text-success border-success/20';
    case 'in-progress':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    case 'roadmap':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const Changelog = () => {
  const shipped = changelogItems.filter((item) => item.status === 'shipped');
  const inProgress = changelogItems.filter((item) => item.status === 'in-progress');
  const roadmap = changelogItems.filter((item) => item.status === 'roadmap');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="section-container">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="badge-frost mb-4 inline-flex items-center gap-2">
              <Rocket className="h-3.5 w-3.5" />
              Changelog & Roadmap
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Vad vi <span className="text-gradient">bygger</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Vi uppdaterar Frost Bygg varje vecka med nya funktioner. Här kan du se vad vi har gjort och vad som kommer.
            </p>
          </div>

          {/* Latest update badge */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success">
              <Rocket className="h-4 w-4" />
              <span className="font-medium">Senaste uppdateringen: ROT AI (Jan 2025)</span>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Shipped */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10 text-success">
                  <Check className="h-4 w-4" />
                </span>
                Lanserat
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-success/20" />
                <div className="space-y-6">
                  {shipped.map((item, index) => (
                    <div key={index} className="relative pl-12">
                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusStyles(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="rounded-xl border border-border bg-card p-5 card-hover">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {item.date}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                  <Hammer className="h-4 w-4" />
                </span>
                Under utveckling
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-yellow-500/20" />
                <div className="space-y-6">
                  {inProgress.map((item, index) => (
                    <div key={index} className="relative pl-12">
                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusStyles(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                            {item.date}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Roadmap */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                </span>
                Roadmap
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  {roadmap.map((item, index) => (
                    <div key={index} className="relative pl-12">
                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusStyles(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 p-5 opacity-80">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {item.date}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Changelog;