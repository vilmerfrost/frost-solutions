import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const customerLogos = [
  { name: 'Bergström Bygg AB', initials: 'BB' },
  { name: 'Nordisk Entreprenad', initials: 'NE' },
  { name: 'Stockholm Renovering', initials: 'SR' },
  { name: 'Moderna Hus Group', initials: 'MH' },
  { name: 'Svensk Byggpartner', initials: 'SB' },
  { name: 'Kvalitetssnickeri Nord', initials: 'KN' },
  { name: 'Fastighetsservice Sverige', initials: 'FS' },
  { name: 'Professionell Målning AB', initials: 'PM' },
];

export function CustomerLogos() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-10 border-y border-border bg-card overflow-hidden">
      <div className="section-container">
        <p 
          ref={ref}
          className={`text-center text-sm text-muted-foreground mb-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
        >
          Företag som redan bytt till Frost Bygg
        </p>
      </div>
      
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-card to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-card to-transparent z-10" />
        
        <div className="flex animate-scroll-logos">
          {[...customerLogos, ...customerLogos].map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex-shrink-0 mx-6 md:mx-10 group"
            >
              <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-200">
                <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center font-semibold text-sm text-muted-foreground group-hover:text-accent group-hover:border-accent/30 transition-colors">
                  {logo.initials}
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground whitespace-nowrap transition-colors">
                  {logo.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
