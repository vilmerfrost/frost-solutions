'use client'

import { SecuritySection } from '@/components/marketing/SecuritySection'
import { TrustBadges } from '@/components/marketing/TrustBadges'

export default function SecurityPage() {
  return (
    <div className="pt-24 pb-16">
      <SecuritySection />
      <TrustBadges />
    </div>
  )
}
