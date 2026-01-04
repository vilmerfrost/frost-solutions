'use client'

import { useEffect, useState } from 'react'
import { useTenant as useTenantContext } from '@/context/TenantContext'

/**
 * Unified tenant resolution hook for client components.
 * Priority: JWT claim (via /api/debug/me) > Context > localStorage fallback
 * 
 * Security: Server-side always validates via JWT app_metadata.tenant_id.
 * This hook is for UI convenience only.
 * 
 * @returns { tenantId: string | null, isLoading: boolean }
 */
export function useTenant(): { tenantId: string | null; isLoading: boolean } {
 const context = useTenantContext()
 const [tenantId, setTenantId] = useState<string | null>(context.tenantId)
 const [isLoading, setIsLoading] = useState(!context.tenantId)

 useEffect(() => {
  // If Context already has tenant, use it
  if (context.tenantId) {
   setTenantId(context.tenantId)
   setIsLoading(false)
   return
  }

  // Try to fetch from /api/debug/me (JWT claim)
  async function fetchFromServer() {
   try {
    const res = await fetch('/api/debug/me')
    if (res.ok) {
     const data = await res.json()
     const claimTenant = data?.tenant_id || data?.app_metadata?.tenant_id
     if (claimTenant) {
      setTenantId(claimTenant)
      context.setTenantId(claimTenant)
      // Sync to localStorage for legacy code (TODO: remove in PR cleanup)
      if (typeof window !== 'undefined') {
       try {
        localStorage.setItem('tenantId', claimTenant)
       } catch {}
      }
      setIsLoading(false)
      return
     }
    }
   } catch (err) {
    // Silent fail, fall through
   }

   // Fallback: localStorage (legacy, for migration period - TODO: remove)
   if (typeof window !== 'undefined') {
    try {
     const stored = localStorage.getItem('tenantId') || localStorage.getItem('tenant_id')
     if (stored) {
      setTenantId(stored)
      context.setTenantId(stored)
      setIsLoading(false)
      return
     }
    } catch {}
   }

   setIsLoading(false)
  }

  fetchFromServer()
 }, [context])

 // If Context updates, sync
 useEffect(() => {
  if (context.tenantId && context.tenantId !== tenantId) {
   setTenantId(context.tenantId)
  }
 }, [context.tenantId, tenantId])

 return { tenantId, isLoading }
}

