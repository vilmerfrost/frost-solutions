import { Metadata } from 'next'
import { Shield, Lock, Server, FileCheck, Eye, RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Säkerhet - Frost Bygg',
  description: 'Hur vi skyddar dina data. GDPR-kompatibelt, krypterad data, och säker infrastruktur.',
}

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-end kryptering',
    description: 'All data krypteras med AES-256 både i transit och i vila. Dina data är skyddade även om någon skulle få tillgång till våra servrar.',
  },
  {
    icon: Shield,
    title: 'GDPR-kompatibelt',
    description: 'Vi följer GDPR fullt ut. Du äger din data och kan exportera eller radera den när som helst.',
  },
  {
    icon: Server,
    title: 'EU-baserad infrastruktur',
    description: 'All data lagras på servrar inom EU (Frankfurt). Inga data lämnar EU utan ditt uttryckliga medgivande.',
  },
  {
    icon: FileCheck,
    title: 'SOC 2 Type II',
    description: 'Vår infrastrukturleverantör (Supabase) är SOC 2 Type II-certifierad, vilket garanterar högsta säkerhetsstandard.',
  },
  {
    icon: Eye,
    title: 'Zero-knowledge design',
    description: 'Vi kan inte se dina personnummer eller känsliga uppgifter. Data krypteras innan den når våra servrar.',
  },
  {
    icon: RefreshCw,
    title: 'Automatisk backup',
    description: 'Dagliga säkerhetskopior med 30 dagars retention. Point-in-time recovery vid behov.',
  },
]

export default function SecurityPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge-frost mb-4 inline-flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            Säkerhet
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Din data är <span className="text-gradient">säker hos oss</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Vi tar säkerhet på allvar. Här är hur vi skyddar ditt företags data.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {securityFeatures.map((feature, index) => (
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

        {/* Compliance Section */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-frost-blue/5 p-8 md:p-12 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Compliance & Certifieringar
            </h2>
            <p className="text-muted-foreground">
              Vi arbetar med branschledande partners för att säkerställa högsta säkerhetsnivå.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-accent mb-2">GDPR</div>
              <p className="text-sm text-muted-foreground">Fullständig efterlevnad</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-accent mb-2">SOC 2</div>
              <p className="text-sm text-muted-foreground">Type II certifierad</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-accent mb-2">ISO 27001</div>
              <p className="text-sm text-muted-foreground">Informationssäkerhet</p>
            </div>
          </div>
        </div>

        {/* Contact for Security */}
        <div className="text-center mt-16">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Frågor om säkerhet?
          </h3>
          <p className="text-muted-foreground mb-6">
            Kontakta vår säkerhetsansvarige för detaljerad information.
          </p>
          <a
            href="mailto:security@frostbygg.se"
            className="text-accent hover:underline font-medium"
          >
            security@frostbygg.se
          </a>
        </div>
      </div>
    </div>
  )
}
