'use client'

import { useState, useEffect, useCallback } from 'react';
import { Snowflake } from 'lucide-react';

// Easter egg state manager
const useEasterEggs = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDiscoMode, setShowDiscoMode] = useState(false);
  const [showFounderMessage, setShowFounderMessage] = useState(false);
  const [showByggletTears, setShowByggletTears] = useState(false);

  // Track logo clicks
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastLogoClick, setLastLogoClick] = useState(0);

  // Track theme toggle clicks
  const [themeClicks, setThemeClicks] = useState(0);
  const [lastThemeClick, setLastThemeClick] = useState(0);

  // Track logo hovers
  const [logoHovers, setLogoHovers] = useState(0);
  const [lastLogoHover, setLastLogoHover] = useState(0);

  // Konami code
  const [konamiIndex, setKonamiIndex] = useState(0);
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

  // Check if already triggered this session
  const hasTriggered = (key: string) => sessionStorage.getItem(`easter-${key}`) === 'true';
  const markTriggered = (key: string) => sessionStorage.setItem(`easter-${key}`, 'true');

  // Triple-click logo
  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    if (now - lastLogoClick < 500) {
      setLogoClicks((prev) => prev + 1);
    } else {
      setLogoClicks(1);
    }
    setLastLogoClick(now);
  }, [lastLogoClick]);

  useEffect(() => {
    if (logoClicks >= 3 && !hasTriggered('logo-confetti')) {
      setShowConfetti(true);
      markTriggered('logo-confetti');
      setTimeout(() => setShowConfetti(false), 3000);
      setLogoClicks(0);
    }
  }, [logoClicks]);

  // Theme toggle spam (10 times in 3 seconds)
  const handleThemeToggle = useCallback(() => {
    const now = Date.now();
    if (now - lastThemeClick < 300) {
      setThemeClicks((prev) => prev + 1);
    } else {
      setThemeClicks(1);
    }
    setLastThemeClick(now);
  }, [lastThemeClick]);

  useEffect(() => {
    if (themeClicks >= 10 && !hasTriggered('disco')) {
      setShowDiscoMode(true);
      markTriggered('disco');
      setTimeout(() => setShowDiscoMode(false), 5000);
      setThemeClicks(0);
    }
  }, [themeClicks]);

  // Logo hover spam
  const handleLogoHover = useCallback(() => {
    const now = Date.now();
    if (now - lastLogoHover < 200) {
      setLogoHovers((prev) => prev + 1);
    } else {
      setLogoHovers(1);
    }
    setLastLogoHover(now);
  }, [lastLogoHover]);

  useEffect(() => {
    if (logoHovers >= 10 && !hasTriggered('founder-message')) {
      setShowFounderMessage(true);
      markTriggered('founder-message');
      setLogoHovers(0);
    }
  }, [logoHovers]);

  // Konami code listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === konamiCode[konamiIndex]) {
        setKonamiIndex((prev) => prev + 1);
      } else {
        setKonamiIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiIndex]);

  useEffect(() => {
    if (konamiIndex === konamiCode.length && !hasTriggered('konami')) {
      setShowByggletTears(true);
      markTriggered('konami');
      setTimeout(() => setShowByggletTears(false), 3000);
      setKonamiIndex(0);
    }
  }, [konamiIndex]);

  // "Frosten" input detector
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.value?.toLowerCase() === 'frosten' && !hasTriggered('frosten')) {
        setShowConfetti(true);
        markTriggered('frosten');
        
        // Show toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl bg-card border border-accent shadow-2xl animate-scale-in';
        toast.innerHTML = '<p class="text-foreground font-medium">👋 Hej Frosten! Du hittade easter egget!</p>';
        document.body.appendChild(toast);
        
        setTimeout(() => {
          toast.remove();
          setShowConfetti(false);
        }, 3000);

        target.value = '';
      }
    };

    document.addEventListener('input', handleInput);
    return () => document.removeEventListener('input', handleInput);
  }, []);

  return {
    showConfetti,
    showDiscoMode,
    showFounderMessage,
    showByggletTears,
    handleLogoClick,
    handleThemeToggle,
    handleLogoHover,
    setShowFounderMessage,
  };
};

// Confetti component
function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {[...Array(60)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            backgroundColor: ['#06b6d4', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 5)],
            width: `${8 + Math.random() * 8}px`,
            height: `${8 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Disco mode overlay
function DiscoMode() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[90] animate-disco-bg opacity-20" />
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-card border border-border shadow-lg animate-scale-in">
        <p className="text-foreground font-medium">🕺 Disco mode activated! 💃</p>
      </div>
    </>
  );
}

// Bygglet tears
function ByggletTears() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="text-center animate-scale-in">
        <div className="text-8xl mb-4">😭</div>
        <p className="text-2xl font-bold text-foreground">Bygglet after seeing Frost Bygg</p>
      </div>
    </div>
  );
}

// Founder message modal
function FounderMessage({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md shadow-2xl animate-scale-in text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-frost flex items-center justify-center mx-auto mb-4">
          <Snowflake className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">👋 Hej! - Vilmer här</h3>
        <p className="text-muted-foreground mb-4">
          Tack för att du utforskar sidan! Du har hittat ett av våra gömda easter eggs.
        </p>
        <p className="text-muted-foreground mb-6">
          Vill du se något coolt? Skriv <span className="font-mono text-accent">"frosten"</span> i valfritt textfält!
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Stäng
        </button>
      </div>
    </div>
  );
}

// Main provider component
export function EasterEggsProvider({ children }: { children: React.ReactNode }) {
  const {
    showConfetti,
    showDiscoMode,
    showFounderMessage,
    showByggletTears,
    handleLogoClick,
    handleThemeToggle,
    handleLogoHover,
    setShowFounderMessage,
  } = useEasterEggs();

  // Expose handlers globally
  useEffect(() => {
    (window as any).__easterEggs = {
      handleLogoClick,
      handleThemeToggle,
      handleLogoHover,
    };
  }, [handleLogoClick, handleThemeToggle, handleLogoHover]);

  return (
    <>
      {children}
      {showConfetti && <Confetti />}
      {showDiscoMode && <DiscoMode />}
      {showByggletTears && <ByggletTears />}
      {showFounderMessage && <FounderMessage onClose={() => setShowFounderMessage(false)} />}
    </>
  );
}

// Hook for components to trigger easter eggs
export function useEasterEggTriggers() {
  return {
    triggerLogoClick: () => (window as any).__easterEggs?.handleLogoClick?.(),
    triggerThemeToggle: () => (window as any).__easterEggs?.handleThemeToggle?.(),
    triggerLogoHover: () => (window as any).__easterEggs?.handleLogoHover?.(),
  };
}