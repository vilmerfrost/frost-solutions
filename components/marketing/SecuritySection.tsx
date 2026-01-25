import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Shield, Server, Lock, Zap, Database, Smartphone } from 'lucide-react';

const securityBadges = [
  {
    icon: Shield,
    title: 'GDPR-compliant',
    description: 'All data hanteras enligt GDPR',
  },
  {
    icon: Server,
    title: 'Data i Sverige 🇸🇪',
    description: 'Servrar i Stockholm',
  },
  {
    icon: Lock,
    title: 'Bank-level encryption',
    description: '256-bit SSL/TLS-kryptering',
  },
  {
    icon: Zap,
    title: '99.9% Uptime SLA',
    description: 'Enterprise-grade infrastruktur',
  },
  {
    icon: Database,
    title: 'Daily backups',
    description: 'Automatisk säkerhetskopiering',
  },
  {
    icon: Smartphone,
    title: 'PWA-certified',
    description: 'Installera som app (iOS/Android)',
  },
];

export function SecuritySection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-16 md:py-24 border-y border-border/30 bg-muted/20">
      <div className="section-container">
        <div ref={ref} className="text-center mb-12">
          <h2 className={`text-2xl md:text-3xl font-bold text-foreground ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Säkerhet & efterlevnad
          </h2>
          <p className={`mt-2 text-muted-foreground ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            Enterprise-grade säkerhet för ditt företag
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {securityBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.title}
                className={`text-center p-4 rounded-xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300 ${
                  isVisible ? `animate-fade-in-up stagger-${(index % 3) + 1}` : 'opacity-0'
                }`}
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-sm text-foreground">{badge.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
