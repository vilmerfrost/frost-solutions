export function FeaturedIn() {
  const publications = [
    { name: 'Byggfakta', logo: '🏗️' },
    { name: 'Byggindustrin', logo: '🏢' },
    { name: 'Dagens Industri', logo: '📰' },
    { name: 'Breakit', logo: '🚀' },
    { name: 'Ny Teknik', logo: '⚡' },
  ];

  return (
    <section className="py-12 border-y border-border/50 bg-muted/30">
      <div className="section-container">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Som sett i
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {publications.map((pub) => (
            <div
              key={pub.name}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <span className="text-2xl grayscale">{pub.logo}</span>
              <span className="text-lg font-medium">{pub.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
