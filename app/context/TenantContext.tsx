'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import supabase from '@/utils/supabase/supabaseClient'
import { BASE_PATH } from '@/utils/url'

type TenantContextType = {
 tenantId: string | null
 isLoading: boolean
 setTenantId: (id: string | null) => void
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
 const [tenantId, setTenantId] = useState<string | null>(null)
 const [isLoading, setIsLoading] = useState(true)

 useEffect(() => {
  async function fetchTenantId() {
   setIsLoading(true)
   try {
    // PRIORITY 1: Check JWT claim first (most authoritative)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    
    if (user) {
     // Check JWT app_metadata for tenant_id
     const jwtTenantId = (user.app_metadata as Record<string, unknown>)?.tenant_id
     if (jwtTenantId && typeof jwtTenantId === 'string') {
      console.log('✅ TenantContext: Found tenant via JWT claim:', jwtTenantId)
      setTenantId(jwtTenantId)
      localStorage.setItem('tenant_id', jwtTenantId)
      setIsLoading(false)
      return
     }
    }

    // PRIORITY 2: Use centralized tenant API
    try {
     const tenantRes = await fetch(`${BASE_PATH}/api/tenant/get-tenant`, { cache: 'no-store' })
     if (tenantRes.ok) {
      const tenantData = await tenantRes.json()
      if (tenantData.tenantId) {
       console.log('✅ TenantContext: Found tenant via API:', tenantData.tenantId, 'source:', tenantData.source)
       setTenantId(tenantData.tenantId)
       localStorage.setItem('tenant_id', tenantData.tenantId)
       setIsLoading(false)
       return
      }
     }
    } catch (apiErr) {
     console.warn('TenantContext: API call failed, trying fallbacks...', apiErr)
    }
    
    // PRIORITY 3: Check localStorage (set during previous successful lookups)
    const storedTenantId = localStorage.getItem('tenant_id')
    if (storedTenantId) {
     console.log('✅ TenantContext: Found tenant via localStorage:', storedTenantId)
     setTenantId(storedTenantId)
     setIsLoading(false)
     return
    }
    
    // PRIORITY 4: Fallback to employee API
    try {
     const employeeRes = await fetch(`${BASE_PATH}/api/employee/get-current`, { cache: 'no-store' })
     if (employeeRes.ok) {
      const employeeData = await employeeRes.json()
      if (employeeData.tenantId) {
       console.log('✅ TenantContext: Found tenant via employee API:', employeeData.tenantId)
       setTenantId(employeeData.tenantId)
       localStorage.setItem('tenant_id', employeeData.tenantId)
       setIsLoading(false)
       return
      }
     }
    } catch (empErr) {
     console.warn('TenantContext: Employee API failed', empErr)
    }
    
    // PRIORITY 5: Direct database lookup (last resort)
    if (user?.id) {
     console.log('🔍 TenantContext: Trying direct DB lookup for user:', user.id)

     // Try by auth_user_id
     const { data: empData } = await supabase
      .from('employees')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
     
     if (empData && empData.tenant_id) {
      console.log('✅ TenantContext: Found tenant from employees table:', empData.tenant_id)
      setTenantId(empData.tenant_id)
      localStorage.setItem('tenant_id', empData.tenant_id)
      setIsLoading(false)
      return
     }

     // Try by email
     if (user.email) {
      const { data: emailData } = await supabase
       .from('employees')
       .select('tenant_id')
       .eq('email', user.email)
       .maybeSingle()
      
      if (emailData && emailData.tenant_id) {
       console.log('✅ TenantContext: Found tenant via email lookup:', emailData.tenant_id)
       setTenantId(emailData.tenant_id)
       localStorage.setItem('tenant_id', emailData.tenant_id)
       setIsLoading(false)
       return
      }
     }
     
     // Try user_roles table (same as server-side)
     const { data: roleData } = await supabase
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle()
     
     if (roleData && roleData.tenant_id) {
      console.log('✅ TenantContext: Found tenant via user_roles:', roleData.tenant_id)
      setTenantId(roleData.tenant_id)
      localStorage.setItem('tenant_id', roleData.tenant_id)
      setIsLoading(false)
      return
     }
    }
    
    console.warn('⚠️ TenantContext: No tenant found after all fallbacks')
   } catch (err) {
    console.error('Error fetching tenant ID:', err)
   } finally {
    setIsLoading(false)
   }
  }

  fetchTenantId()
  
  // Also listen for auth state changes to refetch tenant
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
   if (event === 'SIGNED_OUT') {
    setTenantId(null)
    localStorage.removeItem('tenant_id')
   } else {
    fetchTenantId()
   }
  })
  
  return () => {
   subscription.unsubscribe()
  }
 }, [])

 return (
  <TenantContext.Provider value={{ tenantId, isLoading, setTenantId }}>
   {children}
  </TenantContext.Provider>
 )
}

export const useTenant = () => {
 const context = useContext(TenantContext)
 if (!context) {
  throw new Error('useTenant måste användas inom TenantProvider')
 }
 return context
}
