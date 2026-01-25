'use client'

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/marketing/ui/button';
import { Clock, Timer, Moon, FileText, DollarSign, Briefcase, Sparkles, X, ArrowRight } from 'lucide-react';

const hotspots = [
  {
    id: 1,
    title: 'Tidrapportering',
    description: 'Rapportera tid enkelt från mobilen eller datorn. Automatisk beräkning av arbetade timmar och övertid.',
    icon: Clock,
    position: { top: '15%', left: '10%' },
  },
  {
    id: 2,
    title: 'ROT-automation',
    description: 'AI genererar kompletta ROT-sammanfattningar för Skatteverket automatiskt. Spara timmar varje månad.',
    icon: FileText,
    position: { top: '35%', left: '45%' },
  },
  {
    id: 3,
    title: 'Faktura-OCR',
    description: 'Dra och släpp fakturor - AI läser av leverantör, belopp, datum och radposter på sekunder.',
    icon: DollarSign,
    position: { top: '25%', left: '75%' },
  },
  {
    id: 4,
    title: 'Projekthantering',
    description: 'Överblick över alla projekt med budget, tidplan och resursallokering i realtid.',
    icon: Briefcase,
    position: { top: '70%', left: '15%' },
  },
  {
    id: 5,
    title: 'Lönehantering',
    description: 'Automatisk löneuträkning baserat på tidrapporter. Exportera direkt till Fortnox eller Visma.',
    icon: Timer,
    position: { top: '75%', left: '50%' },
  },
  {
    id: 6,
    title: 'Mörkt läge',
    description: 'Professionellt mörkt tema för bekvämt arbete dygnet runt. Sparar batteri på OLED-skärmar.',
    icon: Moon,
    position: { top: '10%', left: '85%' },
  },
];

export function InteractiveProductTour() {
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [visitedHotspots, setVisitedHotspots] = useState<Set<number>>(new Set());

  const handleHotspotClick = (id: number) => {
    setActiveHotspot(id);
    setVisitedHotspots((prev) => new Set(prev).add(id));
  };

  const handleNext = () => {
    if (activeHotspot === null) return;
    const currentIndex = hotspots.findIndex((h) => h.id === activeHotspot);
    if (currentIndex < hotspots.length - 1) {
      const nextId = hotspots[currentIndex + 1].id;
      setActiveHotspot(nextId);
      setVisitedHotspots((prev) => new Set(prev).add(nextId));
    } else {
      setActiveHotspot(null);
    }
  };

  const allVisited = visitedHotspots.size === hotspots.length;

  return (
    <section className="py-16 md:py-24" id="product-tour">
      <div className="section-container">
        <div className="text-center mb-12">
          <span className="badge-frost mb-4 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Interaktiv demo
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ✨ Utforska funktionerna <span className="text-gradient">interaktivt</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Klicka på de pulsande punkterna för att utforska våra funktioner. {hotspots.length - visitedHotspots.size} kvar att utforska.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Dashboard mockup */}
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl aspect-[16/10]">
            {/* Fake dashboard UI */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/50 to-background">
              {/* Top bar */}
              <div className="h-12 border-b border-border bg-card/80 flex items-center px-4 gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-muted text-xs text-muted-foreground">
                    app.frostbygg.se
                  </div>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="absolute left-0 top-12 bottom-0 w-16 md:w-48 border-r border-border bg-card/50">
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted" />
                      <div className="hidden md:block w-20 h-3 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content area */}
              <div className="absolute left-16 md:left-48 top-12 right-0 bottom-0 p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-xl bg-card border border-border p-4 h-24" />
                  ))}
                </div>
                <div className="rounded-xl bg-card border border-border p-4 h-48" />
              </div>
            </div>

            {/* Hotspots */}
            {hotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                onClick={() => handleHotspotClick(hotspot.id)}
                className={`absolute z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                  activeHotspot === hotspot.id
                    ? 'bg-accent scale-125 ring-4 ring-accent/30'
                    : visitedHotspots.has(hotspot.id)
                    ? 'bg-success'
                    : 'bg-accent animate-pulse hover:scale-110'
                }`}
                style={{ top: hotspot.position.top, left: hotspot.position.left }}
              >
                <span className="text-xs font-bold text-accent-foreground">{hotspot.id}</span>
              </button>
            ))}

            {/* Active tooltip */}
            {activeHotspot !== null && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-2xl p-6 max-w-md shadow-2xl animate-scale-in">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        {(() => {
                          const Icon = hotspots.find((h) => h.id === activeHotspot)?.icon || Clock;
                          return <Icon className="h-6 w-6 text-accent" />;
                        })()}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {hotspots.find((h) => h.id === activeHotspot)?.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {activeHotspot} av {hotspots.length}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveHotspot(null)}
                      className="p-1 rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    {hotspots.find((h) => h.id === activeHotspot)?.description}
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={handleNext} variant="frost" className="flex-1 group">
                      {activeHotspot === hotspots.length ? 'Starta gratis' : 'Nästa'}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* All visited CTA */}
          {allVisited && activeHotspot === null && (
            <div className="mt-8 text-center animate-fade-in">
              <p className="text-success font-medium mb-4">
                ✅ Du har utforskat alla funktioner!
              </p>
              <Button variant="frost" size="lg">
                Starta gratis - Första månaden 0 kr
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
