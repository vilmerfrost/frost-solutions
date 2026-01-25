'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/marketing/ui/button';
import { Bot, Check, Loader2, Clock, Sparkles } from 'lucide-react';

const workTypes = ['Renovering', 'Tillbyggnad', 'Ombyggnad'];

export function TryROTDemo() {
  const [projectName, setProjectName] = useState('');
  const [address, setAddress] = useState('');
  const [workType, setWorkType] = useState('Renovering');
  const [totalCost, setTotalCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const generateROTSummary = () => {
    const addr = address || 'Storgatan 15, Stockholm';
    const total = totalCost || '150000';
    const labor = laborCost || '85000';
    const project = projectName || 'Badrumsrenovering';
    const type = workType.toLowerCase();

    return `${type.charAt(0).toUpperCase() + type.slice(1)} av ${project.toLowerCase()} på ${addr}. Arbetet omfattar total${type} inkl. VVS, kakel och el. Total kostnad ${parseInt(total).toLocaleString('sv-SE')} kr varav ${parseInt(labor).toLocaleString('sv-SE')} kr arbetskostnad. ROT-avdrag beräknat till ${Math.min(parseInt(labor) * 0.3, 50000).toLocaleString('sv-SE')} kr. Projektet utförs av certifierat byggföretag enligt Skatteverkets krav för ROT-avdrag.`;
  };

  const handleGenerate = () => {
    setIsLoading(true);
    setIsDone(false);
    setTypedText('');
    setGeneratedText('');

    setTimeout(() => {
      const summary = generateROTSummary();
      setGeneratedText(summary);
      setIsLoading(false);
    }, 2000);
  };

  // Typing effect
  useEffect(() => {
    if (generatedText && !isLoading) {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= generatedText.length) {
          setTypedText(generatedText.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          setIsDone(true);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }, 15);
      return () => clearInterval(interval);
    }
  }, [generatedText, isLoading]);

  const reset = () => {
    setIsDone(false);
    setTypedText('');
    setGeneratedText('');
    setProjectName('');
    setAddress('');
    setTotalCost('');
    setLaborCost('');
  };

  return (
    <section className="relative py-16 md:py-24 overflow-hidden" id="rot-demo">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#06b6d4', '#3b82f6', '#10b981', '#8b5cf6'][Math.floor(Math.random() * 4)],
                width: '10px',
                height: '10px',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      <div className="section-container">
        <div className="text-center mb-12">
          <span className="badge-frost mb-4 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Prova själv
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Testa ROT-automation <span className="text-gradient">live</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fyll i formuläret nedan och se hur AI genererar en komplett ROT-sammanfattning på sekunder.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
            {!isDone ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Projektnamn
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="T.ex. Badrumsrenovering"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Fastighetsadress
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="T.ex. Storgatan 15, Stockholm"
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Arbetstyp
                    </label>
                    <select
                      value={workType}
                      onChange={(e) => setWorkType(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    >
                      {workTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Total kostnad
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={totalCost}
                        onChange={(e) => setTotalCost(e.target.value)}
                        placeholder="150000"
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        kr
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Arbetskostnad
                    </label>
                    <div className="relative max-w-md">
                      <input
                        type="number"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                        placeholder="85000"
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        kr
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  variant="frost"
                  size="lg"
                  className="w-full md:w-auto relative overflow-hidden group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      AI tänker...
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-5 w-5" />
                      🤖 Generera med AI
                    </>
                  )}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>

                {/* Loading progress */}
                {isLoading && (
                  <div className="mt-6">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent to-frost-blue animate-progress" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Analyserar projektdata och genererar ROT-sammanfattning...
                    </p>
                  </div>
                )}

                {/* Typing output */}
                {typedText && !isDone && (
                  <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-6">
                    <p className="text-foreground leading-relaxed">
                      {typedText}
                      <span className="inline-block w-0.5 h-5 bg-accent ml-0.5 animate-pulse" />
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-6">
                  <Check className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  ✅ Klar på 2 sekunder!
                </h3>

                <div className="flex items-center justify-center gap-8 my-6">
                  <div className="flex items-center gap-2 text-success">
                    <Clock className="h-5 w-5" />
                    <span className="font-mono font-bold text-xl">00:02</span>
                  </div>
                  <span className="text-muted-foreground">vs</span>
                  <div className="flex items-center gap-2 text-destructive/70">
                    <Clock className="h-5 w-5" />
                    <span className="font-mono font-bold text-xl line-through">02:00:00</span>
                  </div>
                </div>

                <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-left mb-6">
                  <p className="text-foreground leading-relaxed">{generatedText}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={reset} variant="frost-outline">
                    Testa igen
                  </Button>
                  <Button variant="frost" className="group">
                    Starta gratis - Första månaden 0 kr
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
