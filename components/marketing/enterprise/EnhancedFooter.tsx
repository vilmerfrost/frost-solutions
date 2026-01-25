import Link from 'next/link';
import { Linkedin, Github, Mail, Phone, Shield, Server, Zap } from 'lucide-react';

const footerLinks = {
  produkt: [
    { label: 'Funktioner', href: '#funktioner' },
    { label: 'Priser', href: '#priser' },
    { label: 'Vs Bygglet', href: '/vs-bygglet' },
    { label: 'Changelog', href: '/changelog' },
  ],
  foretag: [
    { label: 'Om oss', href: '#om-oss' },
    { label: 'Blogg', href: '/blog' },
    { label: 'Villkor', href: '/terms' },
    { label: 'Integritet', href: '/privacy' },
  ],
  kontakt: [
    { label: 'hej@frostbygg.se', href: 'mailto:hej@frostbygg.se', icon: Mail },
    { label: 'LinkedIn', href: '#', icon: Linkedin },
    { label: 'GitHub', href: '#', icon: Github },
  ],
};

const certifications = [
  { icon: Shield, label: 'GDPR' },
  { icon: Server, label: 'Data i Sverige' },
  { icon: Zap, label: '99.9% uptime' },
];

export function EnhancedFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="section-container py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
                FB
              </div>
              <span className="text-lg font-bold text-foreground">Frost Bygg</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Moderna projektverktyg för svenska byggföretag.
            </p>
            
            {/* Certifications */}
            <div className="mt-5 flex flex-wrap gap-4">
              {certifications.map((cert) => (
                <div key={cert.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <cert.icon className="h-3.5 w-3.5" />
                  <span>{cert.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground text-sm">Produkt</h4>
            <ul className="mt-3 space-y-2">
              {footerLinks.produkt.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm">Företag</h4>
            <ul className="mt-3 space-y-2">
              {footerLinks.foretag.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm">Kontakt</h4>
            <ul className="mt-3 space-y-2">
              {footerLinks.kontakt.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>© 2026 Frost Solutions AB · Stockholm 🇸🇪</span>
          <span>Byggd av en 16-åring</span>
        </div>
      </div>
    </footer>
  );
}
