import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { TryROTDemo } from '@/components/TryROTDemo';
import { StatsSection } from '@/components/enterprise/StatsSection';
import { CustomerLogos } from '@/components/enterprise/CustomerLogos';
import { EnhancedFeaturesSection } from '@/components/enterprise/EnhancedFeaturesSection';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { PricingSection } from '@/components/PricingSection';
import { PricingTable } from '@/components/enterprise/PricingTable';
import { Testimonials } from '@/components/enterprise/Testimonials';
import { TrustBadges } from '@/components/TrustBadges';
import { IntegrationsSection } from '@/components/IntegrationsSection';
import { FAQSection } from '@/components/enterprise/FAQSection';
import { AboutSection } from '@/components/AboutSection';
import { ContactSection } from '@/components/ContactSection';
import { EnhancedFooter } from '@/components/enterprise/EnhancedFooter';
import { BackToTop } from '@/components/BackToTop';
import { RecentSignups } from '@/components/social-proof/RecentSignups';
import { EasterEggsProvider } from '@/components/EasterEggs';

const Index = () => {
  return (
    <EasterEggsProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
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
        </main>
        <EnhancedFooter />
        <BackToTop />
        <RecentSignups />
      </div>
    </EasterEggsProvider>
  );
};

export default Index;
