'use client'

import { ComparisonSection } from '@/components/marketing/ComparisonSection'
import { FAQSection } from '@/components/marketing/enterprise/FAQSection'

export default function VsByggletPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="section-container text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Frost Bygg vs <span className="text-accent">Bygglet</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Se hur Frost Bygg jämför sig med Bygglet - och varför vi är det moderna alternativet.
        </p>
      </div>
      <ComparisonSection />
      <FAQSection />
    </div>
  )
}
