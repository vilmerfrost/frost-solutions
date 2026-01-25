'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/marketing/ui/button';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useEasterEggTriggers } from '@/components/marketing/EasterEggs';

const navLinks = [
  { href: '#funktioner', label: 'Funktioner' },
  { href: '#priser', label: 'Priser' },
  { href: '/vs-bygglet', label: 'Vs Bygglet', isRoute: true },
  { href: '#om-oss', label: 'Om oss' },
  { href: '/changelog', label: 'Changelog', isRoute: true },
  { href: '/blog', label: 'Blogg', isRoute: true },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { triggerLogoClick, triggerThemeToggle, triggerLogoHover } = useEasterEggTriggers();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleThemeToggleClick = () => {
    toggleTheme();
    triggerThemeToggle();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="section-container">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 font-bold text-xl text-foreground" 
            onClick={triggerLogoClick} 
            onMouseEnter={triggerLogoHover}
          >
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
              FB
            </div>
            <span className="hidden sm:inline">Frost Bygg</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={handleThemeToggleClick}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Växla tema"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
              <Link href="/login">Logga in</Link>
            </Button>
            <Button variant="frost" size="sm" asChild>
              <Link href="/signup">Boka demo</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Växla tema"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Öppna meny"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-96 pb-6' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col gap-1 pt-4">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </a>
              )
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="ghost" className="justify-start text-muted-foreground" asChild>
                <Link href="/login">Logga in</Link>
              </Button>
              <Button variant="frost" asChild>
                <Link href="/signup">Boka demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
