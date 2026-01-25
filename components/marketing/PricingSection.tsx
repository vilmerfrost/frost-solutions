'use client'

import Link from 'next/link';
import { Button } from '@/components/marketing/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Check, ArrowRight, Zap, Receipt } from 'lucide-react';

const includedFeatures = [
  'Obegränsat antal användare',
  'ROT/RUT automation med AI',
  'Tidrapportering & lön',
  'Projekt & budget',
  'Fortnox & Visma integration',
  'Offline-läge',
  'Email-support inom 24h',
  'Alla framtida funktioner',
];

const payPerUseFeatures = [
  { name: 'AI Fakturaläsning', price: '2 kr', unit: '/faktura', description: 'Automatisk utläsning av leverantörsfakturor' },
  { name: 'AI ROT-sammanfattning', price: '1 kr', unit: '/ansökan', description: 'AI-genererad ROT-sammanfattning' },
];

export function PricingSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="priser" className="py-16 md:py-24">
      <div className="section-container">
        <div ref={ref} className="text-center mb-12">
          <h2 className={`text-2xl md:text-3xl font-bold text-foreground ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Välj ett paket som gör livet enklare
          </h2>
          <p className={`mt-3 text-muted-foreground ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            Transparent prissättning utan dolda avgifter
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 max-w-4xl mx-auto">
          {/* Main Pricing Card */}
          <div className={`flex-1 ${isVisible ? 'animate-fade-in-up stagger-2' : 'opacity-0'}`}>
            <div className="h-full rounded-2xl border-2 border-accent/30 bg-card p-6 md:p-8 hover:border-accent/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <span className="font-semibold text-foreground">Allt-i-ett</span>
              </div>
              
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-foreground">499</span>
                  <span className="text-lg text-muted-foreground">kr/månad</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Första månaden gratis. Ingen bindningstid.
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 group/item">
                    <Check className="h-4 w-4 text-success flex-shrink-0 transition-transform group-hover/item:scale-110" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button variant="hero" size="lg" className="w-full group">
                Beställ Frost Bygg
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Inget betalkort behövs för att starta
              </p>
            </div>
          </div>

          {/* Pay-per-use Add-on Card */}
          <div className={`flex-1 lg:max-w-xs ${isVisible ? 'animate-fade-in-up stagger-3' : 'opacity-0'}`}>
            <div className="h-full rounded-2xl border border-border bg-card p-6 md:p-8 hover:border-accent/30 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground">AI-tillägg</span>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Betala endast för det du använder. Dras automatiskt via Stripe eller Swish.
              </p>

              <div className="space-y-4">
                {payPerUseFeatures.map((feature) => (
                  <div key={feature.name} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group/pay">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-medium text-foreground group-hover/pay:text-accent transition-colors">{feature.name}</span>
                      <span className="text-accent font-bold">{feature.price}<span className="text-xs text-muted-foreground font-normal">{feature.unit}</span></span>
                    </div>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-center text-foreground">
                  <span className="font-semibold">Exempel:</span> 50 fakturor/månad = <span className="text-success font-bold">100 kr</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison note */}
        <div className={`mt-10 text-center ${isVisible ? 'animate-fade-in-up stagger-4' : 'opacity-0'}`}>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Bygglet</span> kostar 2 000–4 000 kr/månad + extra avgifter.{' '}
            <span className="font-semibold text-success">Spara 30 000 kr/år</span> med Frost Bygg.
          </p>
        </div>
      </div>
    </section>
  );
}
