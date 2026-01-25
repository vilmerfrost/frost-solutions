'use client'

import { useState, useEffect, useRef } from 'react';
import { PiggyBank } from 'lucide-react';

export function TotalSavings() {
  const [savings, setSavings] = useState(247890);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setSavings((prev) => prev + Math.floor(Math.random() * 100) + 50);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  return (
    <div
      ref={ref}
      className="rounded-xl bg-gradient-to-r from-success/10 via-success/5 to-emerald-500/10 border border-success/20 p-6 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <PiggyBank className="h-5 w-5 text-success" />
        <span className="text-sm text-muted-foreground">Frost Bygg-användare har sparat</span>
      </div>
      <p className="text-3xl md:text-4xl font-bold text-success">
        💰 {savings.toLocaleString('sv-SE')} kr
      </p>
      <p className="text-sm text-muted-foreground mt-1">den här månaden</p>
    </div>
  );
}
