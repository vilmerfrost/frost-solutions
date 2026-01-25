'use client'

import { useState, useRef, useEffect } from 'react';
import { GripVertical, X, Check } from 'lucide-react';

export function ComparisonSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(10, Math.min(90, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  const byggletFeatures = [
    'Ingen AI',
    'Ingen offline-läge',
    'Gammal design',
    'Per-användare avgifter',
    'Setup-avgift 10,000 kr',
  ];

  const frostByggFeatures = [
    'AI-automation',
    'Offline-först',
    'Modern 2025 design',
    'Obegränsat användare',
    'Ingen setup-avgift',
  ];

  return (
    <div className="py-16 md:py-24" id="comparison-slider">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Se skillnaden <span className="text-gradient">med egna ögon</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dra reglaget för att jämföra Bygglet och Frost Bygg sida vid sida.
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border shadow-xl cursor-ew-resize select-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
        >
          {/* Bygglet side (left) */}
          <div
            className="absolute inset-0 bg-muted/50"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <div className="p-6 md:p-10 h-full grayscale opacity-80">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-muted-foreground/20 flex items-center justify-center text-2xl">
                  🏗️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground/60">Bygglet</h3>
                  <p className="text-destructive font-bold">2,000-4,000 kr/månad</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {byggletFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                      <X className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-foreground/60">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Fake old UI */}
              <div className="mt-8 rounded-xl border border-border/50 bg-card/50 p-4">
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Frost Bygg side (right) */}
          <div
            className="bg-gradient-to-br from-background to-accent/5 min-h-[400px]"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            <div className="p-6 md:p-10 h-full ml-auto" style={{ width: `${100 - sliderPosition}%`, marginLeft: `${sliderPosition}%` }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-frost flex items-center justify-center text-2xl">
                  ❄️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Frost Bygg</h3>
                  <p className="text-success font-bold">499 kr/månad</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {frostByggFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Fake modern UI */}
              <div className="mt-8 rounded-xl border border-accent/20 bg-gradient-to-br from-card to-accent/5 p-4 shadow-cyan">
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-gradient-to-r from-accent/30 to-frost-blue/30 rounded" />
                  <div className="h-4 w-1/2 bg-gradient-to-r from-accent/20 to-frost-blue/20 rounded" />
                  <div className="h-10 w-full bg-gradient-to-r from-accent/10 to-frost-blue/10 rounded border border-accent/20" />
                  <div className="h-10 w-full bg-gradient-frost rounded flex items-center justify-center text-xs text-primary-foreground font-medium">
                    ✨ AI-Automation
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slider handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-accent cursor-ew-resize z-10"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-accent border-4 border-background shadow-lg flex items-center justify-center">
              <GripVertical className="h-5 w-5 text-accent-foreground" />
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          👆 Dra reglaget för att jämföra
        </p>
      </div>
    </div>
  );
}
