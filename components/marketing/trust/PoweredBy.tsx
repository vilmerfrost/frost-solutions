export function PoweredBy() {
  const techStack = [
    { name: 'React', tooltip: 'Lightning-fast performance', icon: '⚛️' },
    { name: 'Supabase', tooltip: 'Enterprise database', icon: '🔋' },
    { name: 'Google Gemini', tooltip: 'Advanced AI', icon: '🤖' },
    { name: 'Groq', tooltip: 'Fastest AI inference', icon: '⚡' },
    { name: 'Vercel', tooltip: 'Global edge network', icon: '▲' },
  ];

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-4">Powered by</p>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {techStack.map((tech) => (
          <div
            key={tech.name}
            className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-default"
            title={tech.tooltip}
          >
            <span className="text-lg">{tech.icon}</span>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {tech.name}
            </span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {tech.tooltip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
