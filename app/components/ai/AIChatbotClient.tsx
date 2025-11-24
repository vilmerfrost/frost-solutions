'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Client Component that handles dynamic import with SSR disabled
const AIChatbotWrapper = dynamic(
  () => import('@/components/ai/AIChatbotWrapper'),
  { 
    ssr: false,
    loading: () => null // Don't show anything while loading
  }
)

export default function AIChatbotClient() {
  const [mounted, setMounted] = useState(false)

  // Only render on client side to avoid SSR issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <AIChatbotWrapper />
}

