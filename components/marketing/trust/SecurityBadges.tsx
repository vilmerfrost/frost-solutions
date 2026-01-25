import { Shield, Lock, Server, Zap } from 'lucide-react';

const badges = [
  { icon: Lock, text: 'GDPR Compliant' },
  { icon: Server, text: 'Data stored in Sweden', flag: '🇸🇪' },
  { icon: Shield, text: 'Bank-level security' },
  { icon: Zap, text: '99.9% uptime' },
];

export function SecurityBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
      {badges.map((badge) => (
        <div
          key={badge.text}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-sm text-muted-foreground"
        >
          <badge.icon className="h-4 w-4" />
          <span>{badge.flag || '🔒'} {badge.text}</span>
        </div>
      ))}
    </div>
  );
}
