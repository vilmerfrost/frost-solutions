'use client'

import './marketing.css'
import { Toaster } from '@/components/marketing/ui/toaster'
import { Toaster as Sonner } from '@/components/marketing/ui/sonner'
import { TooltipProvider } from '@/components/marketing/ui/tooltip'
import { Navbar } from '@/components/marketing/Navbar'
import { EnhancedFooter } from '@/components/marketing/enterprise/EnhancedFooter'
import { BackToTop } from '@/components/marketing/BackToTop'
import { RecentSignups } from '@/components/marketing/social-proof/RecentSignups'
import { EasterEggsProvider } from '@/components/marketing/EasterEggs'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <EasterEggsProvider>
        <Toaster />
        <Sonner />
        <div className="marketing-wrapper min-h-screen">
          <Navbar />
          <main>{children}</main>
          <EnhancedFooter />
          <BackToTop />
          <RecentSignups />
        </div>
      </EasterEggsProvider>
    </TooltipProvider>
  )
}
