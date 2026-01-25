import { CheckCircle } from 'lucide-react';

export function SystemStatus() {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
      </span>
      Alla system operativa
    </a>
  );
}
