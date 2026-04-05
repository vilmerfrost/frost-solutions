'use client'

import { useTenant as useTenantContext } from '@/context/TenantContext'

/**
 * Unified tenant resolution hook for client components.
 * Delegates to TenantContext which resolves via JWT claims -> API -> DB lookup.
 *
 * Security: Server-side always validates via JWT app_metadata.tenant_id.
 * This hook is for UI convenience only.
 *
 * @returns { tenantId: string | null, isLoading: boolean }
 */
export function useTenant(): { tenantId: string | null; isLoading: boolean } {
 const { tenantId, isLoading } = useTenantContext()
 return { tenantId, isLoading }
}

