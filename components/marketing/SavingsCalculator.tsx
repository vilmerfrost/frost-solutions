'use client'

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/marketing/ui/button';
import { Clock, PiggyBank, TrendingUp, Calculator, ArrowRight } from 'lucide-react';

function useCountUp(end: number, duration: number = 1000, start: number = 0) {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = countRef.current;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (end - startValue) * easeOut);
      
      setCount(currentValue);
      countRef.current = currentValue;

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration]);

  return count;
}

export function SavingsCalculator() {
  const [employees, setEmployees] = useState(5);
  const [rotApps, setRotApps] = useState(5);
  const [invoices, setInvoices] = useState(30);

  // Calculate savings
  const rotHoursSaved = rotApps * 1.9;
  const invoiceHoursSaved = invoices * 0.08;
  const totalHoursSaved = rotHoursSaved + invoiceHoursSaved;

  // Assume Bygglet costs 800kr per user + 1000kr base = example pricing
  const byggletCost = 1000 + employees * 400; // Simplified
  const frostByggCost = 499;
  const monthlySavingsVsBygglet = Math.max(byggletCost - frostByggCost, 0);

  const hourlyRate = 500;
  const timeSavingsValue = totalHoursSaved * hourlyRate;
  const totalMonthlySavings = monthlySavingsVsBygglet + timeSavingsValue;
  const roi = ((totalMonthlySavings / frostByggCost) * 100);
  const annualSavings = totalMonthlySavings * 12;

  // Animated values
  const animatedHours = useCountUp(Math.round(totalHoursSaved * 10) / 10, 800);
  const animatedMoneySaved = useCountUp(Math.round(totalMonthlySavings), 800);
  const animatedROI = useCountUp(Math.round(roi), 800);

  return (
    <section className="py-16 md:py-24 bg-muted/30" id="kalkylator">
      <div className="section-container">
        <div className="text-center mb-12">
          <span className="badge-frost mb-4 inline-flex items-center gap-2">
            <Calculator className="h-3.5 w-3.5" />
            Beräkna dina besparingar
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Se vad <span className="text-gradient">du kan spara</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Justera reglagen för att se hur mycket tid och pengar ditt företag kan spara med Frost Bygg.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
            {/* Sliders */}
            <div className="grid gap-8 md:grid-cols-3 mb-10">
              {/* Employees */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">
                    Antal anställda
                  </label>
                  <span className="text-lg font-bold text-accent">{employees}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={employees}
                  onChange={(e) => setEmployees(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer slider-frost"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>

              {/* ROT Applications */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">
                    ROT-ansökningar/månad
                  </label>
                  <span className="text-lg font-bold text-accent">{rotApps}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={rotApps}
                  onChange={(e) => setRotApps(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer slider-frost"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>20</span>
                </div>
              </div>

              {/* Invoices */}
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">
                    Leverantörsfakturor/månad
                  </label>
                  <span className="text-lg font-bold text-accent">{invoices}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={invoices}
                  onChange={(e) => setInvoices(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer slider-frost"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Time Saved */}
              <div className="rounded-xl border border-border bg-background p-6 text-center card-hover">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">Tid sparad</p>
                <p className="text-4xl font-bold text-foreground mb-1">
                  {animatedHours}
                  <span className="text-lg font-normal text-muted-foreground ml-1">tim/mån</span>
                </p>
                <div className="text-xs text-muted-foreground mt-3 space-y-1">
                  <p>ROT: {rotHoursSaved.toFixed(1)} tim</p>
                  <p>Fakturor: {invoiceHoursSaved.toFixed(1)} tim</p>
                </div>
              </div>

              {/* Money Saved */}
              <div className="rounded-xl border-2 border-success/30 bg-success/5 p-6 text-center relative overflow-hidden">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success mb-4">
                  <PiggyBank className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">Pengar sparade</p>
                <p className="text-4xl font-bold text-success mb-1">
                  {animatedMoneySaved.toLocaleString('sv-SE')}
                  <span className="text-lg font-normal text-success/70 ml-1">kr/mån</span>
                </p>
                <div className="text-xs text-muted-foreground mt-3 space-y-1">
                  <p>Vs Bygglet: {monthlySavingsVsBygglet.toLocaleString('sv-SE')} kr</p>
                  <p>Tidsvärde: {timeSavingsValue.toLocaleString('sv-SE')} kr</p>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-success text-success-foreground rounded-full animate-pulse-slow">
                    💰
                  </span>
                </div>
              </div>

              {/* ROI */}
              <div className="rounded-xl border border-border bg-gradient-to-br from-accent/5 to-frost-blue/5 p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">ROI</p>
                <p className="text-4xl font-bold text-gradient mb-1">
                  {animatedROI}%
                </p>
                <div className="text-xs text-muted-foreground mt-3 space-y-1">
                  <p>Investering: 499 kr/mån</p>
                  <p>Avkastning: {totalMonthlySavings.toLocaleString('sv-SE')} kr/mån</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 text-center">
              <Button variant="frost" size="xl" className="group">
                💰 Spara {annualSavings.toLocaleString('sv-SE')} kr/år - Starta gratis
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                Inget betalkort behövs. Avsluta när du vill.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
