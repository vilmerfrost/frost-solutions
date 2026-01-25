'use client'

import { useState } from 'react';
import { Button } from '@/components/marketing/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Check, X, ArrowRight, Calculator } from 'lucide-react';

const comparisonData = [
  { feature: 'Pris/månad', bygglet: '2,000-4,000 kr', frost: '499 kr', frostWins: true },
  { feature: 'Setup-avgift', bygglet: '~10,000 kr', frost: 'Gratis', frostWins: true },
  { feature: 'Per användare', bygglet: 'Extra kostnad', frost: 'Obegränsat', frostWins: true },
  { feature: 'AI ROT automation', bygglet: 'Manuellt', frost: 'AI-drivet', frostWins: true, byggletNo: true },
  { feature: 'AI Faktura-läsning', bygglet: 'Manuellt', frost: 'AI-drivet', frostWins: true, byggletNo: true },
  { feature: 'Modern UI', bygglet: '2010 design', frost: '2025 design', frostWins: true, byggletNo: true },
  { feature: 'Offline-läge', bygglet: 'Kräver internet', frost: 'Full offline', frostWins: true, byggletNo: true },
  { feature: 'Uppdateringar', bygglet: 'Månader för nya features', frost: 'Veckor för nya features', frostWins: true },
  { feature: 'Support', bygglet: 'Email/telefon', frost: 'Email + live chat', frostWins: true },
];

export function ComparisonSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const [employees, setEmployees] = useState(5);
  const [rotApplications, setRotApplications] = useState(10);
  const [invoices, setInvoices] = useState(30);

  // Calculate savings
  const timePerRotManual = 2; // hours
  const timePerRotAI = 2 / 60; // hours (2 minutes)
  const timePerInvoiceManual = 10 / 60; // hours (10 minutes)
  const timePerInvoiceAI = 10 / 3600; // hours (10 seconds)

  const timeSavedRot = (timePerRotManual - timePerRotAI) * rotApplications;
  const timeSavedInvoice = (timePerInvoiceManual - timePerInvoiceAI) * invoices;
  const totalTimeSaved = Math.round(timeSavedRot + timeSavedInvoice);

  const hourlyRate = 500; // SEK per hour
  const monthlySavingsTime = totalTimeSaved * hourlyRate;
  const monthlySavingsSub = 2500 - 499; // Assuming average Bygglet price of 2500
  const yearlySavings = (monthlySavingsTime + monthlySavingsSub) * 12;
  const roi = Math.round((yearlySavings / (499 * 12)) * 100);

  return (
    <section id="vs-bygglet" className="relative py-20 md:py-32">
      <div className="section-container">
        <div ref={ref} className="text-center">
          <span className={`badge-frost mb-4 inline-block ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Jämförelse
          </span>
          <h2 className={`text-3xl font-bold text-foreground md:text-4xl lg:text-5xl ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            Varför byta från{' '}
            <span className="text-secondary">Bygglet?</span>
          </h2>
        </div>

        {/* Comparison Table */}
        <div className={`mt-12 overflow-hidden rounded-2xl border border-border/50 bg-card ${isVisible ? 'animate-fade-in-up stagger-2' : 'opacity-0'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Funktion</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-secondary">Bygglet</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-accent">Frost Bygg</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={row.feature}
                    className="group border-b border-border/50 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        {row.byggletNo && <X className="h-4 w-4 text-destructive" />}
                        {row.bygglet}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-foreground">
                        {row.frost}
                        {row.frostWins && <Check className="h-4 w-4 text-success" />}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className={`mt-16 ${isVisible ? 'animate-fade-in-up stagger-3' : 'opacity-0'}`}>
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-frost-blue/5 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">ROI-kalkylator</h3>
                <p className="text-sm text-muted-foreground">Se vad du kan spara med Frost Bygg</p>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Antal anställda: <span className="text-accent">{employees}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={employees}
                    onChange={(e) => setEmployees(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    ROT-ansökningar per månad: <span className="text-accent">{rotApplications}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={rotApplications}
                    onChange={(e) => setRotApplications(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Leverantörsfakturor per månad: <span className="text-accent">{invoices}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={invoices}
                    onChange={(e) => setInvoices(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="rounded-xl bg-card border border-border/50 p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-gradient">{totalTimeSaved}h</div>
                    <div className="text-xs text-muted-foreground">Tid sparad/månad</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-success">{Math.round(yearlySavings / 1000)}k kr</div>
                    <div className="text-xs text-muted-foreground">Besparing/år</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-accent">{roi}%</div>
                    <div className="text-xs text-muted-foreground">ROI</div>
                  </div>
                </div>

                <Button variant="hero" className="mt-6 w-full group">
                  Se vad du kan spara - starta gratis
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
