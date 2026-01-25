import Link from 'next/link';
import { Button } from '@/components/marketing/ui/button';
import { ArrowRight, Check, Star } from 'lucide-react';

export function HeroSection() {
  const features = ['Resursplanering', 'Tidrapporter', 'Offerter', 'Fakturor'];

  return (
    <section className="relative min-h-[85vh] pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center lg:text-left lg:mx-0">
          {/* Social proof badge */}
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4">
              96% nöjda kunder
            </span>
          </div>

          {/* Main headline */}
          <h1 className="animate-fade-in-up stagger-1 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
            Det ska inte vara ett projekt att driva projekt.
          </h1>

          {/* Feature list */}
          <div className="animate-fade-in-up stagger-2 mt-8 flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-2">
            {features.map((feature) => (
              <span key={feature} className="text-base text-muted-foreground">
                {feature}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up stagger-3 mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
            <Button variant="hero" size="xl" className="group">
              Skaffa Frost Bygg
              <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button variant="hero-secondary" size="xl">
              Boka demo
            </Button>
          </div>

          {/* Testimonial quote */}
          <div className="animate-fade-in-up stagger-4 mt-12 rounded-xl border border-border bg-card p-5 text-left">
            <p className="text-base font-medium text-accent">
              "Frost Bygg sparade mig 12 timmar första veckan. Nu slipper jag sitta med pappersarbete på kvällarna."
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                EA
              </div>
              <span className="text-sm text-muted-foreground">
                Erik på Anderssons Bygg, Stockholm
              </span>
            </div>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in-up stagger-5 mt-8 flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Gratis i 30 dagar
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Ingen bindningstid
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              Kom igång på 2 min
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
