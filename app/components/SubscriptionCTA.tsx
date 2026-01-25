// app/components/SubscriptionCTA.tsx
// Call-to-action component for upgrading to paid subscription
'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, Sparkles } from 'lucide-react';

interface SubscriptionCTAProps {
  variant?: 'default' | 'banner' | 'card';
  showFeatures?: boolean;
}

export function SubscriptionCTA({ variant = 'default', showFeatures = false }: SubscriptionCTAProps) {
  const handleUpgrade = () => {
    // Route to custom checkout page
    window.location.href = '/checkout';
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">
              🎉 1 Månad Gratis!
            </h2>
            <p className="text-white/90 mb-4">
              Få full tillgång till alla funktioner helt gratis i 30 dagar. Därefter 499 kr/månad.
            </p>
            <Button
              onClick={handleUpgrade}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Starta gratis provperiod
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Uppgradera till Allt-i-Ett
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          499 kr/månad - 1 månad gratis när du registrerar dig
        </p>
        {showFeatures && (
          <ul className="space-y-2 mb-4 text-sm">
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-green-600">✓</span>
              Obegränsade projekt & anställda
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-green-600">✓</span>
              ROT/RUT-avdrag
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-green-600">✓</span>
              Fortnox & Visma integration
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-green-600">✓</span>
              AI-funktioner & OCR
            </li>
          </ul>
        )}
        <Button onClick={handleUpgrade} className="w-full">
          <CreditCard className="w-4 h-4 mr-2" />
          Starta gratis provperiod
        </Button>
      </div>
    );
  }

  // Default button
  return (
    <Button onClick={handleUpgrade}>
      <CreditCard className="w-4 h-4 mr-2" />
      Aktivera betalning
    </Button>
  );
}

