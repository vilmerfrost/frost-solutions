import { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/HeroSection'
import { TryROTDemo } from '@/components/marketing/TryROTDemo'
import { StatsSection } from '@/components/marketing/enterprise/StatsSection'
import { CustomerLogos } from '@/components/marketing/enterprise/CustomerLogos'
import { EnhancedFeaturesSection } from '@/components/marketing/enterprise/EnhancedFeaturesSection'
import { SavingsCalculator } from '@/components/marketing/SavingsCalculator'
import { PricingSection } from '@/components/marketing/PricingSection'
import { PricingTable } from '@/components/marketing/enterprise/PricingTable'
import { Testimonials } from '@/components/marketing/enterprise/Testimonials'
import { TrustBadges } from '@/components/marketing/TrustBadges'
import { IntegrationsSection } from '@/components/marketing/IntegrationsSection'
import { FAQSection } from '@/components/marketing/enterprise/FAQSection'
import { AboutSection } from '@/components/marketing/AboutSection'
import { ContactSection } from '@/components/marketing/ContactSection'

export const metadata: Metadata = {
  title: 'Frost Bygg - Modern byggadministration för svenska byggföretag',
  description: 'Automatisera ROT-avdrag, hantera projekt och fakturor med AI. 30 dagars gratis provperiod. Ingen bindningstid.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <CustomerLogos />
      <EnhancedFeaturesSection />
      <TryROTDemo />
      <SavingsCalculator />
      <PricingSection />
      <PricingTable />
      <Testimonials />
      <TrustBadges />
      <IntegrationsSection />
      <FAQSection />
      <AboutSection />
      <ContactSection />
    </>
  )
}
