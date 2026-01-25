import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { FileText, Building, Receipt, Brain, Zap, CreditCard, Smartphone, ShoppingBag } from 'lucide-react';

const integrations = [
  {
    name: 'Fortnox',
    description: 'Exportera löner och bokföring direkt',
    icon: FileText,
    available: true,
  },
  {
    name: 'Visma',
    description: 'Sömlös integration med Visma eEkonomi',
    icon: Building,
    available: true,
  },
  {
    name: 'Skatteverket',
    description: 'ROT/RUT-ansökningar direkt till Skatteverket',
    icon: Receipt,
    available: true,
  },
  {
    name: 'Google Gemini',
    description: 'AI-powered OCR och automation',
    icon: Brain,
    available: true,
  },
  {
    name: 'Groq',
    description: 'Blixtsnabba AI-sammanfattningar',
    icon: Zap,
    available: true,
  },
];

const comingSoon = [
  { name: 'BankID', description: 'Säker inloggning', icon: Smartphone },
  { name: 'Swish', description: 'Betalningar', icon: CreditCard },
  { name: 'Stripe', description: 'Fakturering', icon: ShoppingBag },
];

export function IntegrationsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="relative py-20 md:py-32">
      <div className="section-container">
        <div ref={ref} className="text-center">
          <span className={`badge-frost mb-4 inline-block ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Integrationer
          </span>
          <h2 className={`text-3xl font-bold text-foreground md:text-4xl lg:text-5xl ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            Integrerar med verktygen du{' '}
            <span className="text-gradient">redan använder</span>
          </h2>
        </div>

        {/* Available Integrations */}
        <div className={`mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 ${isVisible ? 'animate-fade-in-up stagger-2' : 'opacity-0'}`}>
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="card-hover group rounded-xl border border-border/50 bg-card p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                <integration.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-foreground">{integration.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <div className={`mt-12 ${isVisible ? 'animate-fade-in-up stagger-3' : 'opacity-0'}`}>
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
              Kommer snart
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {comingSoon.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center gap-3 rounded-full border border-border/50 bg-card/50 px-5 py-3"
              >
                <integration.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium text-foreground">{integration.name}</span>
                  <span className="text-xs text-muted-foreground"> · {integration.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
