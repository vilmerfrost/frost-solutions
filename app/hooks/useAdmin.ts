import { useState, useEffect, useRef } from 'react'
import { useTenant } from '@/context/TenantContext'

// Simple in-memory cache for admin status (per tenant)
const adminCache = new Map<string, { isAdmin: boolean; employeeId: string | null; timestamp: number }>()
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
    const res = await fetch('/api/admin/check', { cache: 'no-store' })
    if (res.ok) {
     const data = await res.json()
     const adminStatus = data.isAdmin || false
     const empId = data.employeeId || null
     
     setIsAdmin(adminStatus)
     setEmployeeId(empId)
     
     // Cache the result
     adminCache.set(tenantId, {
      isAdmin: adminStatus,
      employeeId: empId,
      timestamp: Date.now()
     })
    } else {
     setIsAdmin(false)
     setEmployeeId(null)
     console.error('Admin check failed:', await res.text())
    }
   } catch (err) {
    console.error('Error checking admin:', err)
    setIsAdmin(false)
    setEmployeeId(null)
   } finally {
    setLoading(false)
    checkingRef.current = false
   }
  }

  checkAdmin()
 }, [tenantId])

 return { isAdmin, loading, employeeId }
}

