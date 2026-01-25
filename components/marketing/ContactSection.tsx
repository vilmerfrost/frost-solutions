'use client'

import { useState } from 'react';
import { Button } from '@/components/marketing/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ArrowRight, Send, Calendar, Check } from 'lucide-react';

export function ContactSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <section id="kontakt" className="py-16 md:py-24">
      <div className="section-container">
        <div ref={ref} className="text-center mb-10">
          <h2 className={`text-2xl md:text-3xl font-bold text-foreground ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Redo att testa?
          </h2>
          <p className={`mt-3 text-muted-foreground ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            Kom igång på 2 minuter eller boka en personlig demo
          </p>
        </div>

        <div className={`grid gap-6 md:grid-cols-2 max-w-4xl mx-auto ${isVisible ? 'animate-fade-in-up stagger-2' : 'opacity-0'}`}>
          {/* Self-service option */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ArrowRight className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Starta direkt</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Inget betalkort behövs. Första månaden gratis.
            </p>

            <ul className="mt-5 space-y-2">
              {['Gratis första månaden', 'Ingen bindningstid', 'Alla funktioner'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-success" />
                  {item}
                </li>
              ))}
            </ul>

            <Button variant="hero" size="lg" className="mt-6 w-full group">
              Starta gratis
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>

          {/* Book demo option */}
          <div className="rounded-xl border-2 border-accent/30 bg-card p-6 md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Boka demo</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              15 minuter med Vilmer. Vi svarar inom 24h.
            </p>

            {isSubmitted ? (
              <div className="mt-6 rounded-lg bg-success/10 p-5 text-center">
                <Check className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-semibold text-foreground">Tack!</p>
                <p className="text-sm text-muted-foreground">Vi hör av oss inom 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Namn"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                  />
                  <input
                    type="text"
                    placeholder="Företag"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
                <Button variant="frost" size="default" type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Skicka
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
