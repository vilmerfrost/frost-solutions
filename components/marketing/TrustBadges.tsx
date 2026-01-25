import { Shield, Clock, CreditCard } from 'lucide-react';

const guarantees = [
  {
    icon: Shield,
    title: '30 dagars garanti',
    description: 'Inte nöjd? Pengarna tillbaka, inga frågor.',
  },
  {
    icon: Clock,
    title: 'Snabb setup',
    description: 'Kom igång på under 5 minuter.',
  },
  {
    icon: CreditCard,
    title: 'Inget betalkort',
    description: 'Testa gratis utan kortuppgifter.',
  },
];

export function TrustBadges() {
  return (
    <section className="py-10 bg-muted/50 border-y border-border">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {guarantees.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex flex-col items-center">
                <Icon className="h-6 w-6 text-accent mb-2" />
                <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
