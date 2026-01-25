'use client'

import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { 
  Calendar, FileText, Clock, Receipt, PieChart, Zap,
  MapPin, Users, Bell, Shield, Smartphone, BarChart3,
  FileCheck, Wrench, CalendarDays, Globe, CreditCard, Settings,
  ChevronDown, ChevronUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/marketing/ui/button';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

const features: Feature[] = [
  {
    icon: Clock,
    title: 'Digital tidstämpling',
    description: 'Ett klick för att stämpla in/ut. Automatisk OB-beräkning för kväll, natt och helg.',
    badge: 'Populär',
  },
  {
    icon: MapPin,
    title: 'GPS Auto-incheckning',
    description: 'Automatisk incheckning när du kommer till arbetsplatsen. Konfigurerbar radie.',
  },
  {
    icon: Zap,
    title: 'AI Fakturaläsning',
    description: 'Dra & släpp leverantörsfakturor. AI extraherar alla uppgifter automatiskt.',
    badge: '2 kr/st',
  },
  {
    icon: FileCheck,
    title: 'ROT/RUT Automation',
    description: 'AI genererar sammanfattningar för Skatteverket. Från 2 timmar till 2 minuter.',
    badge: 'AI',
  },
  {
    icon: PieChart,
    title: 'Projektbudget',
    description: 'Realtidsöverblick av budget vs. faktisk tid. Automatiska varningar vid överskridning.',
  },
  {
    icon: Receipt,
    title: 'Fakturering',
    description: 'Skapa fakturor direkt från projekt. PDF-generering och e-postutskick.',
  },
  {
    icon: Users,
    title: 'Medarbetarhantering',
    description: 'Roller, behörigheter och löneunderlag. Admin- och anställd-vyer.',
  },
  {
    icon: CalendarDays,
    title: 'Schemaläggning',
    description: 'Drag & drop-kalender. Konfliktdetektering och frånvarohantering.',
  },
  {
    icon: Wrench,
    title: 'Arbetsordrar',
    description: 'Komplett arbetsorderflöde med statusar, foton och prioritering.',
  },
  {
    icon: FileText,
    title: 'ÄTA-hantering',
    description: 'Tilläggsarbeten med godkännandeflöde. Bilagor och automatisk fakturering.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Diagram och rapporter för timmar, intäkter och projektöversikt.',
  },
  {
    icon: Globe,
    title: 'Kundportal',
    description: 'Kunder kan se offerter och fakturor via säker länk. Ingen inloggning krävs.',
  },
  {
    icon: Shield,
    title: 'Multi-tenant säkerhet',
    description: 'Komplett dataisolering. Row Level Security på alla tabeller.',
  },
  {
    icon: Settings,
    title: 'Fortnox & Visma',
    description: 'Sömlös integration med era befintliga bokföringssystem.',
  },
  {
    icon: Smartphone,
    title: 'PWA & Offline',
    description: 'Installera som app. Full funktionalitet utan internet.',
  },
  {
    icon: Bell,
    title: 'Notifikationer',
    description: 'Realtidsnotiser för viktiga händelser. Inget missas.',
  },
  {
    icon: CreditCard,
    title: 'Lönehantering',
    description: 'Automatisk OB-beräkning. Exportera till PDF eller CSV.',
  },
  {
    icon: Calendar,
    title: 'Resursplanering',
    description: 'Rätt person på rätt plats. Semester- och frånvarohantering.',
  },
];

const INITIAL_VISIBLE_COUNT = 8;

export function EnhancedFeaturesSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const [showAll, setShowAll] = useState(false);

  const visibleFeatures = showAll ? features : features.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenCount = features.length - INITIAL_VISIBLE_COUNT;

  return (
    <section id="funktioner" className="py-16 md:py-24 bg-card border-y border-border">
      <div className="section-container">
        <div ref={ref} className="text-center mb-12">
          <h2 className={`text-2xl md:text-3xl font-bold text-foreground ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Allt Bygglet har – och mer därtill
          </h2>
          <p className={`mt-3 text-muted-foreground max-w-2xl mx-auto ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            18+ funktioner designade för svenska byggföretag. Moderna. Snabba. AI-drivna.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleFeatures.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Show More / Show Less Button */}
        {hiddenCount > 0 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAll(!showAll)}
              className="group gap-2 px-8"
            >
              {showAll ? (
                <>
                  Visa färre
                  <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                </>
              ) : (
                <>
                  Visa alla {features.length} funktioner
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`group relative p-5 rounded-xl bg-background border border-border hover:border-accent/40 hover:shadow-md transition-all duration-300 ${
        isVisible ? `animate-fade-in-up` : 'opacity-0'
      }`}
      style={{ animationDelay: `${(index % 8) * 0.05}s` }}
    >
      {/* Badge */}
      {feature.badge && (
        <span className="absolute -top-2 right-3 px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">
          {feature.badge}
        </span>
      )}

      {/* Icon */}
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-all duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <h3 className="mb-1.5 font-semibold text-foreground group-hover:text-accent transition-colors">
        {feature.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}
