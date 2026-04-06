'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const ServiceWorkerRegister = dynamic(() => import('@/components/ServiceWorkerRegister'), { ssr: false })
const SafeSyncComponents = dynamic(() => import('@/components/SafeSyncComponents').then(m => ({ default: m.SafeSyncComponents })), { ssr: false })
const SyncInitializer = dynamic(() => import('@/components/SyncInitializer').then(m => ({ default: m.SyncInitializer })), { ssr: false })
const AIChatbotClient = dynamic(() => import('@/components/ai/AIChatbotClient'), { ssr: false })
const KeyboardShortcutsProvider = dynamic(() => import('@/components/KeyboardShortcutsProvider').then(m => ({ default: m.KeyboardShortcutsProvider })), { ssr: false })
const WhatsNewDialog = dynamic(() => import('@/components/WhatsNewDialog').then(m => ({ default: m.WhatsNewDialog })), { ssr: false })

export function ClientExtras() {
 return (
  <>
   <ErrorBoundary fallback={null}>
    <SyncInitializer />
   </ErrorBoundary>
   <SafeSyncComponents />
   <ServiceWorkerRegister />
   <KeyboardShortcutsProvider />
   <ErrorBoundary fallback={null}>
    <WhatsNewDialog />
   </ErrorBoundary>
   <ErrorBoundary fallback={null}>
    <div style={{ position: 'relative', zIndex: 1 }}>
     <AIChatbotClient />
    </div>
   </ErrorBoundary>
  </>
 )
}
