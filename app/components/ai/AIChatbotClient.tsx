'use client'

import dynamic from 'next/dynamic'

// Client Component that handles dynamic import with SSR disabled
const AIChatbotWrapper = dynamic(
  () => import('@/components/ai/AIChatbotWrapper'),
  { ssr: false }
)

export default function AIChatbotClient() {
  return <AIChatbotWrapper />
}

