'use client'

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

const signups = [
  { name: 'Johan', city: 'Stockholm' },
  { name: 'Emma', city: 'Göteborg' },
  { name: 'Anders', city: 'Malmö' },
  { name: 'Lisa', city: 'Uppsala' },
  { name: 'Erik', city: 'Linköping' },
  { name: 'Maria', city: 'Örebro' },
  { name: 'Per', city: 'Helsingborg' },
  { name: 'Anna', city: 'Jönköping' },
  { name: 'Lars', city: 'Norrköping' },
  { name: 'Karin', city: 'Lund' },
];

export function RecentSignups() {
  const [currentSignup, setCurrentSignup] = useState<typeof signups[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      const randomSignup = signups[Math.floor(Math.random() * signups.length)];
      setCurrentSignup(randomSignup);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Initial delay
    const initialTimeout = setTimeout(() => {
      showNotification();
    }, 8000);

    // Recurring interval
    const interval = setInterval(() => {
      showNotification();
    }, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!currentSignup || !isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border shadow-lg max-w-xs">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-foreground font-medium">
            👤 {currentSignup.name} från {currentSignup.city}
          </p>
          <p className="text-xs text-muted-foreground">
            började nyss en prövotid
          </p>
        </div>
      </div>
    </div>
  );
}
