import { useState, useEffect, useRef } from 'react'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'

// Simple in-memory cache for admin status (per tenant)
const adminCache = new Map<string, { isAdmin: boolean; employeeId: string | null; role: string | null; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

/**
 * Hook för att kontrollera om användare är admin
 * Använder API route för att kringgå RLS-problem
 * Inkluderar caching för att förhindra onödiga API-anrop
 */
export function useAdmin() {
 const { tenantId } = useTenant()
 const [isAdmin, setIsAdmin] = useState(false)
 const [loading, setLoading] = useState(true)
 const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
 const checkingRef = useRef(false)

 useEffect(() => {
  async function checkAdmin() {
   if (!tenantId) {
    setLoading(false)
    setIsAdmin(false)
    return
   }

   // Check cache first
   const cached = adminCache.get(tenantId)
   if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    setIsAdmin(cached.isAdmin)
    setEmployeeId(cached.employeeId)
      setRole(cached.role)
    setLoading(false)
    return
   }

   // Prevent duplicate concurrent requests
   if (checkingRef.current) {
    return
   }

   checkingRef.current = true
   setLoading(true)
   
   try {
    const data = await apiFetch<{ isAdmin?: boolean; employeeId?: string | null; role?: string | null }>('/api/admin/check', { cache: 'no-store' })
    const adminStatus = data.isAdmin || false
    const empId = data.employeeId || null
    const currentRole = data.role || null
    
    setIsAdmin(adminStatus)
    setEmployeeId(empId)
    setRole(currentRole)
    
    // Cache the result
    adminCache.set(tenantId, {
     isAdmin: adminStatus,
     employeeId: empId,
     role: currentRole,
     timestamp: Date.now()
    })
   } catch (err) {
    console.error('Error checking admin:', err)
    setIsAdmin(false)
    setEmployeeId(null)
    setRole(null)
   } finally {
    setLoading(false)
    checkingRef.current = false
   }
  }

  checkAdmin()
 }, [tenantId])

 return { isAdmin, loading, employeeId, role }
}

