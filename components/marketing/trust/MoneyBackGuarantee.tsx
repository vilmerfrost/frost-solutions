import { Shield, Check } from 'lucide-react';

export function MoneyBackGuarantee() {
  return (
    <div className="inline-flex flex-col items-center p-6 rounded-2xl border-2 border-success/20 bg-success/5">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-4">
        <Shield className="h-8 w-8" />
      </div>
      <h4 className="text-lg font-bold text-foreground mb-2 text-center">
        30-dagars pengarna-tillbaka-garanti
      </h4>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Ingen risk. Ingen bindningstid. Full återbetalning om du inte är nöjd.
      </p>
      <div className="flex items-center gap-2 mt-4 text-sm text-success">
        <Check className="h-4 w-4" />
        <span>100% Riskfritt</span>
      </div>
    </div>
  );
}
