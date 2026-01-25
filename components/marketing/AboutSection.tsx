import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Quote, MapPin, Calendar } from 'lucide-react';

export function AboutSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="om-oss" className="py-16 md:py-24">
      <div className="section-container">
        <div ref={ref} className="mx-auto max-w-3xl">
          <div className={`text-center mb-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Byggt av en 16-åring som visste att byggbranschen förtjänar bättre
            </h2>
          </div>

          {/* Story */}
          <div className={`rounded-2xl border border-border bg-card p-6 md:p-10 ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                2026
              </div>
              <div className="h-1 w-1 rounded-full bg-muted-foreground" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Stockholm, Sverige
              </div>
            </div>

            <div className="relative">
              <Quote className="absolute -left-1 -top-1 h-6 w-6 text-accent/30" />
              <div className="space-y-4 pl-6 text-foreground leading-relaxed">
                <p>
                  Jag såg hur små byggföretag betalade{' '}
                  <span className="font-semibold">3,000 kr/månad för Bygglet</span> – en plattform som kändes gammal och krånglig.
                </p>
                <p className="text-muted-foreground">
                  Ingen AI. Ingen offline-funktion. Ingen transparent prissättning.
                </p>
                <p>
                  Så jag byggde Frost Bygg. Modern. AI-driven.{' '}
                  <span className="font-semibold text-accent">499 kr/månad</span>.
                </p>
                <p>
                  Första kunden sparade 15 timmar första månaden bara på ROT-automation.
                </p>
              </div>
            </div>

            {/* Signature */}
            <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
                VF
              </div>
              <div>
                <div className="font-bold text-foreground">Vilmer Frost</div>
                <div className="text-sm text-muted-foreground">Grundare, 16 år</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
