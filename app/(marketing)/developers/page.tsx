import { Metadata } from 'next'
import { Code, Webhook, Key, FileJson, Zap, BookOpen } from 'lucide-react'
import { Button } from '@/components/marketing/ui/button'

export const metadata: Metadata = {
  title: 'Utvecklare - Frost Bygg API',
  description: 'Bygg integrationer med Frost Bygg. RESTful API, webhooks och fullständig dokumentation.',
}

const apiFeatures = [
  {
    icon: FileJson,
    title: 'RESTful API',
    description: 'Modern REST API med JSON-format. Enkelt att integrera med alla språk och plattformar.',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description: 'Realtidsnotifikationer när något händer. Projekt skapas, fakturor skickas, tid rapporteras.',
  },
  {
    icon: Key,
    title: 'OAuth 2.0',
    description: 'Säker autentisering med OAuth 2.0. Stöd för både authorization code och client credentials.',
  },
  {
    icon: Zap,
    title: 'Rate Limits',
    description: '1000 requests/minut för vanliga endpoints. Högre limits tillgängliga på förfrågan.',
  },
]

const codeExample = `// Hämta alla projekt
const response = await fetch('https://api.frostbygg.se/v1/projects', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const projects = await response.json();
console.log(projects);`

export default function DevelopersPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge-frost mb-4 inline-flex items-center gap-2">
            <Code className="h-3.5 w-3.5" />
            För utvecklare
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Bygg med <span className="text-gradient">Frost Bygg API</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Integrera Frost Bygg med dina befintliga system. Fullständig API-dokumentation och webhooks.
          </p>
        </div>

        {/* API Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {apiFeatures.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card p-6 card-hover"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Code Example */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="rounded-2xl border border-border bg-gray-900 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-sm text-gray-400">example.js</span>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono">
                {codeExample}
              </code>
            </pre>
          </div>
        </div>

        {/* Available Endpoints */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Tillgängliga endpoints
          </h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Endpoint</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Beskrivning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-6 py-4 font-mono text-sm text-accent">GET /v1/projects</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">Lista alla projekt</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-sm text-accent">POST /v1/projects</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">Skapa nytt projekt</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-sm text-accent">GET /v1/invoices</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">Lista alla fakturor</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-sm text-accent">POST /v1/time-entries</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">Rapportera tid</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-sm text-accent">GET /v1/employees</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">Lista anställda</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-frost-blue/5 p-8 md:p-12 text-center max-w-4xl mx-auto">
          <BookOpen className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Kom igång med API:et
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Läs vår fullständiga dokumentation och börja bygga integrationer idag.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="frost">
              Läs dokumentationen
            </Button>
            <Button variant="outline">
              Skapa API-nyckel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
