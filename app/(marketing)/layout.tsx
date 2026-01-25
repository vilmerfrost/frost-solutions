'use client'

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
    <EasterEggsProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main>{children}</main>
        <EnhancedFooter />
        <BackToTop />
        <RecentSignups />
      </div>
    </EasterEggsProvider>
  )
}
