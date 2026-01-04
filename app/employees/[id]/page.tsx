'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'

export default function EmployeePage() {
 const router = useRouter()
 const params = useParams()
 const { tenantId } = useTenant()

 const employeeId = params?.id as string | undefined

 useEffect(() => {
  // Redirect to new payslip page
  if (employeeId && tenantId) {
   router.replace(`/payroll/employeeID/${employeeId}`)
  }
 }, [employeeId, tenantId, router])

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
   <div className="text-center">
    <p className="text-gray-600 dark:text-gray-400 mb-4">Omdirigerar till lönespec...</p>
   </div>
  </div>
 )
}
