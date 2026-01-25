import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Check, X } from 'lucide-react';

const comparisonRows = [
  { feature: 'Månadskostnad', bygglet: '2,000-4,000 kr', frost: '499 kr', frostWins: true },
  { feature: 'Setup-avgift', bygglet: '~10,000 kr', frost: 'Gratis', frostWins: true },
  { feature: 'Per användare', bygglet: 'Extra kostnad', frost: 'Obegränsat', frostWins: true },
  { feature: 'AI ROT automation', bygglet: false, frost: true, frostWins: true },
  { feature: 'AI Faktura-läsning', bygglet: false, frost: true, frostWins: true },
  { feature: 'Tidrapportering', bygglet: 'Basic', frost: 'Advanced', frostWins: true },
  { feature: 'Lönehantering', bygglet: 'Basic', frost: '+ OB-beräkning', frostWins: true },
  { feature: 'Projektbudget', bygglet: 'Basic', frost: 'Real-time', frostWins: true },
  { feature: 'Offline-läge', bygglet: false, frost: true, frostWins: true },
  { feature: 'Fortnox integration', bygglet: true, frost: true, frostWins: false },
  { feature: 'Visma integration', bygglet: true, frost: true, frostWins: false },
  { feature: 'Modern UI', bygglet: '2010 design', frost: '2025 design', frostWins: true },
  { feature: 'Dark mode', bygglet: false, frost: true, frostWins: true },
  { feature: 'Uppdateringsfrekvens', bygglet: 'Månader', frost: 'Veckor', frostWins: true },
  { feature: 'Support', bygglet: 'Email/telefon', frost: 'Email + Live chat', frostWins: true },
];

function CellValue({ value, isWinner }: { value: boolean | string; isWinner: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className={`h-5 w-5 ${isWinner ? 'text-success' : 'text-muted-foreground'}`} />
    ) : (
      <X className="h-5 w-5 text-destructive" />
    );
  }
  return (
    <span className={isWinner ? 'text-success font-medium' : 'text-muted-foreground'}>
      {value}
    </span>
  );
}

export function PricingTable() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-20 md:py-32">
      <div className="section-container">
        <div ref={ref} className="text-center mb-12">
          <span className={`badge-frost mb-4 inline-block ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Jämförelse
          </span>
          <h2 className={`text-3xl font-bold text-foreground md:text-4xl lg:text-5xl ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}>
            Frost Bygg vs <span className="text-gradient">Bygglet</span>
          </h2>
          <p className={`mt-4 text-lg text-muted-foreground ${isVisible ? 'animate-fade-in-up stagger-2' : 'opacity-0'}`}>
            Se exakt vad du får för pengarna
          </p>
        </div>

        {/* Desktop Table */}
        <div className={`hidden md:block rounded-2xl border border-border overflow-hidden ${isVisible ? 'animate-fade-in-up stagger-3' : 'opacity-0'}`}>
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-4 font-semibold text-foreground">Funktion</th>
                <th className="text-center p-4 font-semibold text-muted-foreground w-1/4">Bygglet</th>
                <th className="text-center p-4 font-semibold text-accent w-1/4 bg-accent/5">Frost Bygg</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, index) => (
                <tr key={row.feature} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                  <td className="p-4 text-foreground font-medium">{row.feature}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center">
                      <CellValue value={row.bygglet} isWinner={!row.frostWins} />
                    </div>
                  </td>
                  <td className="p-4 text-center bg-accent/5">
                    <div className="flex justify-center">
                      <CellValue value={row.frost} isWinner={row.frostWins} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 border-t-2 border-border">
                <td className="p-4 font-bold text-foreground text-lg">TOTAL ÅRSKOSTNAD</td>
                <td className="p-4 text-center text-destructive font-bold text-lg">30,000-60,000 kr</td>
                <td className="p-4 text-center bg-accent/5 text-success font-bold text-lg">5,988 kr</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {comparisonRows.map((row, index) => (
            <div 
              key={row.feature}
              className={`p-4 rounded-xl border border-border bg-card ${isVisible ? `animate-fade-in-up stagger-${(index % 3) + 1}` : 'opacity-0'}`}
            >
              <p className="font-medium text-foreground mb-3">{row.feature}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Bygglet</p>
                  <div className="flex justify-center">
                    <CellValue value={row.bygglet} isWinner={!row.frostWins} />
                  </div>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent/10">
                  <p className="text-xs text-accent mb-1">Frost Bygg</p>
                  <div className="flex justify-center">
                    <CellValue value={row.frost} isWinner={row.frostWins} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Annual savings callout */}
        <div className={`mt-8 p-6 rounded-2xl bg-gradient-to-r from-success/10 via-success/5 to-emerald-500/10 border border-success/20 text-center ${isVisible ? 'animate-fade-in-up stagger-4' : 'opacity-0'}`}>
          <p className="text-2xl md:text-3xl font-bold text-success">
            Spara upp till 54,000 kr/år
          </p>
          <p className="text-muted-foreground mt-2">
            genom att byta från Bygglet till Frost Bygg
          </p>
        </div>
      </div>
    </section>
  );
}
