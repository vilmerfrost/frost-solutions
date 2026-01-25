import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Building2, Users, MapPin, TrendingUp, Clock } from 'lucide-react';

const caseStudies = [
  {
    company: 'Anderssons Bygg AB',
    location: 'Stockholm',
    size: '5 anställda',
    problem: 'Vi spenderade 15 timmar/månad på ROT-pappersarbete',
    result: 'Med Frost Bygg: 2 timmar/månad. Sparade 25,000 kr första året.',
    metrics: [
      { label: '87% tidsbesparing', icon: Clock },
      { label: '25,000 kr/år', icon: TrendingUp },
    ],
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    company: 'Ljusdal Snickeri',
    location: 'Ljusdal',
    size: '2 anställda',
    problem: 'Bygglet kostade för mycket för vårt lilla företag',
    result: 'Samma funktioner för 1/5 av priset. Plus AI-funktioner Bygglet inte har.',
    metrics: [
      { label: '80% billigare', icon: TrendingUp },
      { label: 'AI-fördel', icon: Building2 },
    ],
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    company: 'Göteborg Måleri AB',
    location: 'Göteborg',
    size: '8 anställda',
    problem: 'Klumpig mobil-app. Fungerade inte offline.',
    result: 'Frost Bygg PWA fungerar perfekt på byggplatsen utan internet.',
    metrics: [
      { label: '100% uptime', icon: Clock },
      { label: 'Offline-först', icon: Building2 },
    ],
    gradient: 'from-violet-500 to-purple-600',
  },
];

export function CaseStudiesSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="relative py-20 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="ice-pattern absolute inset-0" />

      <div className="section-container relative">
        <div ref={ref} className="text-center">
          <span className={`badge-frost mb-4 inline-block ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Kundberättelser
          </span>
          <h2 className={`text-3xl font-bold text-foreground md:text-4xl lg:text-5xl ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            Företag som redan{' '}
            <span className="text-gradient">bytt</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {caseStudies.map((study, index) => (
            <CaseStudyCard key={study.company} study={study} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudyCard({ study, index }: { study: typeof caseStudies[0]; index: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`card-hover group relative overflow-hidden rounded-2xl border border-border/50 bg-card ${
        isVisible ? `animate-fade-in-up stagger-${index + 1}` : 'opacity-0'
      }`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${study.gradient} p-6`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{study.company}</h3>
            <div className="flex items-center gap-3 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {study.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {study.size}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground">Problemet:</p>
          <p className="mt-1 text-foreground italic">"{study.problem}"</p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground">Resultatet:</p>
          <p className="mt-1 text-foreground">{study.result}</p>
        </div>

        {/* Metrics */}
        <div className="flex flex-wrap gap-2">
          {study.metrics.map((metric) => (
            <span
              key={metric.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
            >
              <metric.icon className="h-3 w-3" />
              {metric.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
