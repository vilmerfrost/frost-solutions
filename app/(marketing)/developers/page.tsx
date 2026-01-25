'use client'

import { IntegrationsSection } from '@/components/marketing/IntegrationsSection'

export default function DevelopersPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="section-container text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Developer <span className="text-accent">API</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Integrera Frost Bygg med dina befintliga system genom vårt robusta API.
        </p>
      </div>
      <IntegrationsSection />
    </div>
  )
}
