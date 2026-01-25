import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Zap, FileText, Tag, Puzzle, Wifi, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Zap,
    badge: 'AI-automation',
    title: 'ROT-ansökningar på 2 minuter',
    description: 'AI genererar kompletta sammanfattningar för Skatteverket automatiskt. Spara över 10 timmar per månad.',
    iconBg: 'bg-accent/10 text-accent',
  },
  {
    icon: FileText,
    badge: '99% noggrannhet',
    title: 'Automatisk fakturaläsning',
    description: 'Dra och släpp faktura – AI extraherar leverantör, belopp, datum och radposter på sekunder.',
    iconBg: 'bg-accent/10 text-accent',
  },
  {
    icon: Tag,
    badge: 'Transparent prissättning',
    title: '499 kr/månad. Allt inkluderat.',
    description: 'Ingen setup-avgift. Obegränsat antal användare. Jämfört med Bygglet: 2 000-4 000 kr/månad.',
    iconBg: 'bg-success/10 text-success',
  },
  {
    icon: Puzzle,
    badge: 'Integrationer',
    title: 'Anslut till era befintliga system',
    description: 'Sömlös integration med Fortnox och Visma. Exportera löner och fakturor direkt.',
    iconBg: 'bg-accent/10 text-accent',
  },
  {
    icon: Wifi,
    badge: 'Offlinestöd',
    title: 'Fungerar på byggarbetsplatsen',
    description: 'Full funktionalitet utan internet. Data synkas automatiskt när uppkoppling finns.',
    iconBg: 'bg-accent/10 text-accent',
  },
  {
    icon: Sparkles,
    badge: 'Modern plattform',
    title: 'Byggd för dagens behov',
    description: 'Responsiv design, snabba laddningstider och regelbundna uppdateringar baserade på kundfeedback.',
    iconBg: 'bg-accent/10 text-accent',
  },
];

export function FeaturesSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="funktioner" className="relative py-20 md:py-28 bg-muted/30">
      <div className="section-container">
        <div ref={ref} className="text-center">
          <span className={`badge-frost mb-4 inline-block ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Funktioner
          </span>
          <h2 className={`text-3xl font-bold text-foreground md:text-4xl ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            Effektiva verktyg för byggbranschen
          </h2>
          <p className={`mx-auto mt-4 max-w-2xl text-lg text-muted-foreground ${isVisible ? 'animate-fade-in-up stagger-2' : 'opacity-0'}`}>
            Utvecklade tillsammans med svenska byggföretag för att lösa verkliga utmaningar.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`group relative rounded-lg border border-border bg-card p-6 transition-shadow duration-200 hover:shadow-md ${
        isVisible ? `animate-fade-in-up stagger-${(index % 3) + 1}` : 'opacity-0'
      }`}
    >
      {/* Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {feature.badge}
        </span>
      </div>

      {/* Icon */}
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.iconBg}`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {feature.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}
