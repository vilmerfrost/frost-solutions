'use client'

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

export function LiveStats() {
  const [count, setCount] = useState(127);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('frostbygg-companies');
    if (saved) {
      setCount(parseInt(saved));
    }

    // Increment every 30 seconds when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setCount((prev) => {
          const newCount = prev + 1;
          localStorage.setItem('frostbygg-companies', newCount.toString());
          return newCount;
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm">
      <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
      <span className="text-foreground font-medium">
        <span className="text-accent font-bold">{count}</span> företag använder Frost Bygg
      </span>
    </div>
  );
}
