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
    // PRIORITY 1: Use centralized tenant API (single source of truth)
    const tenantRes = await fetch(`${BASE_PATH}/api/tenant/get-tenant`, { cache: 'no-store' })
    if (tenantRes.ok) {
     const tenantData = await tenantRes.json()
     if (tenantData.tenantId) {
      console.log('✅ TenantContext: Found tenant via centralized API:', tenantData.tenantId, 'source:', tenantData.source)
      setTenantId(tenantData.tenantId)
      setIsLoading(false)
      return
     }
    }
    
    // PRIORITY 2: Fallback to employee API
    const employeeRes = await fetch(`${BASE_PATH}/api/employee/get-current`, { cache: 'no-store' })
    if (employeeRes.ok) {
     const employeeData = await employeeRes.json()
     if (employeeData.tenantId) {
      console.log('✅ TenantContext: Found tenant via employee API:', employeeData.tenantId)
      setTenantId(employeeData.tenantId)
      setIsLoading(false)
      return
     }
    }
    
    // PRIORITY 3: Legacy fallback to employees table (should rarely be needed)
    console.warn('⚠️ TenantContext: All API routes failed, trying legacy method...')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
     console.warn('Could not get user for tenant lookup:', userError)
     return
    }
    
    const userId = userData?.user?.id
    if (!userId) {
     console.log('No user ID available for tenant lookup')
     return
    }

    console.log('🔍 Fetching tenant from employees table for user:', userId)

    const employeeResult = await supabase
     .from('employees')
     .select('tenant_id')
     .eq('auth_user_id', userId)
     .maybeSingle()
    
    let employeeData: any = employeeResult.data
    let empError = employeeResult.error

    if (empError || !employeeData) {
     const userEmail = userData?.user?.email
     if (userEmail) {
      console.log('Trying to find employee by email:', userEmail)
      const emailResult = await supabase
       .from('employees')
       .select('tenant_id')
       .eq('email', userEmail)
       .maybeSingle()
      
      if (emailResult.data) {
       employeeData = emailResult.data
       empError = null
      }
     }
    }

    if (employeeData?.tenant_id) {
     console.log('✅ TenantContext: Found tenant from employees table:', employeeData.tenant_id)
     setTenantId(employeeData.tenant_id)
    } else {
     console.warn('⚠️ No employee record found for user:', userId, empError)
    }
   } catch (err) {
    console.error('Error fetching tenant ID:', err)
   } finally {
    setIsLoading(false)
   }
  }

  fetchTenantId()
  
  // Also listen for auth state changes to refetch tenant
  const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
   fetchTenantId()
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