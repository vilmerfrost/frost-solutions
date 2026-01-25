import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/marketing/ui/button'
import { Check, X, ArrowRight, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Frost Bygg vs Bygglet - Jämförelse 2025',
  description: 'Detaljerad jämförelse mellan Frost Bygg och Bygglet. Se vilken lösning som passar ditt byggföretag bäst.',
}

const comparisonData = [
  {
    category: 'Pris',
    features: [
      { name: 'Grundpris', frost: '499 kr/mån', bygglet: 'Från 395 kr/mån' },
      { name: 'Per användare', frost: 'Obegränsat', bygglet: '+89 kr/användare' },
      { name: 'Bindningstid', frost: 'Ingen', bygglet: '12 månader' },
      { name: 'Gratis provperiod', frost: '30 dagar', bygglet: '14 dagar' },
    ],
  },
  {
    category: 'Funktioner',
    features: [
      { name: 'ROT-automation (AI)', frost: true, bygglet: false },
      { name: 'Faktura-OCR (AI)', frost: true, bygglet: false },
      { name: 'Offline-läge', frost: true, bygglet: false },
      { name: 'Projekthantering', frost: true, bygglet: true },
      { name: 'Tidrapportering', frost: true, bygglet: true },
      { name: 'Fakturering', frost: true, bygglet: true },
      { name: 'Fortnox-integration', frost: true, bygglet: true },
      { name: 'Visma-integration', frost: true, bygglet: false },
      { name: 'Dark mode', frost: true, bygglet: false },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Chatt-support', frost: true, bygglet: true },
      { name: 'Telefonsupport', frost: true, bygglet: 'Extra kostnad' },
      { name: 'Svensk support', frost: true, bygglet: true },
      { name: 'Svarstid', frost: '<24h', bygglet: '1-3 dagar' },
    ],
  },
]

export default function VsByggletPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge-frost mb-4 inline-flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" />
            Jämförelse
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frost Bygg vs <span className="text-gradient">Bygglet</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Se hur Frost Bygg jämför sig med Bygglet. Spoiler: Vi har AI och de har inte det.
          </p>
        </div>

        {/* Quick Summary */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <div className="rounded-2xl border-2 border-accent bg-accent/5 p-8">
            <div className="text-2xl font-bold text-accent mb-2">Frost Bygg</div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-success" />
                AI-driven automation
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-success" />
                Obegränsat antal användare
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-success" />
                Ingen bindningstid
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-success" />
                Modern teknik (2025)
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="text-2xl font-bold text-muted-foreground mb-2">Bygglet</div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <X className="h-5 w-5 text-destructive" />
                Ingen AI
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <X className="h-5 w-5 text-destructive" />
                89 kr per extra användare
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <X className="h-5 w-5 text-destructive" />
                12 månaders bindning
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <X className="h-5 w-5 text-destructive" />
                Äldre teknik
              </li>
            </ul>
          </div>
        </div>

        {/* Detailed Comparison */}
        <div className="max-w-5xl mx-auto mb-16">
          {comparisonData.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">{section.category}</h2>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Funktion</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-accent">Frost Bygg</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">Bygglet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {section.features.map((feature, featureIndex) => (
                      <tr key={featureIndex}>
                        <td className="px-6 py-4 text-sm text-foreground">{feature.name}</td>
                        <td className="px-6 py-4 text-center">
                          {typeof feature.frost === 'boolean' ? (
                            feature.frost ? (
                              <Check className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-destructive mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-medium text-accent">{feature.frost}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {typeof feature.bygglet === 'boolean' ? (
                            feature.bygglet ? (
                              <Check className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-destructive mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{feature.bygglet}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-frost-blue/5 p-8 md:p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Redo att byta till framtiden?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Prova Frost Bygg gratis i 30 dagar. Ingen bindningstid, ingen kreditkortskrav.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="frost" asChild>
              <Link href="/signup">
                Starta gratis provperiod
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Boka demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
