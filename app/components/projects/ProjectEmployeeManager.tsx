'use client'

import { useState, useEffect } from 'react'
import { Users, X, Plus, Loader } from 'lucide-react'
import { toast } from '@/lib/toast'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'

interface Employee {
 id: string
 full_name: string
 email?: string
 role?: string
}

interface ProjectEmployee {
 id: string
 employee_id: string
 assigned_at: string
 employees: Employee
}

interface ProjectEmployeeManagerProps {
 projectId: string
}

export function ProjectEmployeeManager({ projectId }: ProjectEmployeeManagerProps) {
 const { tenantId } = useTenant()
 const [assignedEmployees, setAssignedEmployees] = useState<ProjectEmployee[]>([])
 const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
 const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
 const [loading, setLoading] = useState(true)
 const [assigning, setAssigning] = useState(false)
 const [removing, setRemoving] = useState<string | null>(null)

 // Fetch assigned employees
 const fetchAssignedEmployees = async () => {
  try {
   const data = await apiFetch<{ success?: boolean; data?: ProjectEmployee[]; error?: string }>(`/api/projects/${projectId}/employees`)

   if (data.success) {
    setAssignedEmployees(data.data || [])
   } else {
    throw new Error(data.error || 'Failed to fetch assigned employees')
   }
  } catch (error: any) {
   console.error('Error fetching assigned employees:', error)
   toast.error('Kunde inte ladda tilldelade anställda')
  } finally {
   setLoading(false)
  }
 }

 // Fetch available employees (all employees in tenant)
 const fetchAvailableEmployees = async () => {
  if (!tenantId) return

  try {
   const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email, role')
    .eq('tenant_id', tenantId)
    .order('full_name', { ascending: true })

   if (error) throw error

   setAvailableEmployees(data || [])
  } catch (error: any) {
   console.error('Error fetching available employees:', error)
   toast.error('Kunde inte ladda tillgängliga anställda')
  }
 }

 useEffect(() => {
  fetchAssignedEmployees()
  fetchAvailableEmployees()
 }, [projectId, tenantId])

 // Get employees not yet assigned
 const unassignedEmployees = availableEmployees.filter(
  (emp) => !assignedEmployees.some((assigned) => assigned.employee_id === emp.id)
 )

 const handleAssign = async () => {
  if (!selectedEmployeeId) {
   toast.error('Välj en anställd')
   return
  }

  setAssigning(true)
  try {
   const data = await apiFetch<{ success?: boolean; error?: string }>(`/api/projects/${projectId}/employees`, {
    method: 'POST',
    body: JSON.stringify({ employee_id: selectedEmployeeId }),
   })

   if (data.success) {
    toast.success('Anställd tilldelad!')
    setSelectedEmployeeId('')
    fetchAssignedEmployees()
    fetchAvailableEmployees()
   } else {
    throw new Error(data.error || 'Failed to assign employee')
   }
  } catch (error: any) {
   console.error('Error assigning employee:', error)
   toast.error(error.message || 'Kunde inte tilldela anställd')
  } finally {
   setAssigning(false)
  }
 }

 const handleRemove = async (employeeId: string) => {
  setRemoving(employeeId)
  try {
   const res = await fetch(
    `/api/projects/${projectId}/employees?employee_id=${employeeId}`,
    {
     method: 'DELETE',
    }
   )

   const data = await res.json()

   if (data.success) {
    toast.success('Anställd borttagen från projektet')
    fetchAssignedEmployees()
    fetchAvailableEmployees()
   } else {
    throw new Error(data.error || 'Failed to remove employee')
   }
  } catch (error: any) {
   console.error('Error removing employee:', error)
   toast.error(error.message || 'Kunde inte ta bort anställd')
  } finally {
   setRemoving(null)
  }
 }

 if (loading) {
  return (
   <div className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-primary-200 dark:border-primary-700 p-6">
    <div className="flex items-center justify-center py-8">
     <Loader className="w-6 h-6 animate-spin text-primary-500 dark:text-primary-400" />
    </div>
   </div>
  )
 }

 return (
  <div className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-primary-200 dark:border-primary-700 p-6">
   <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-primary-500 hover:bg-primary-600 rounded-lg">
     <Users className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
     Projektansvariga
    </h3>
   </div>

   {/* Assigned Employees List */}
   {assignedEmployees.length > 0 ? (
    <div className="space-y-3 mb-6">
     {assignedEmployees.map((assignment) => (
      <div
       key={assignment.id}
       className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-primary-100 dark:border-primary-800 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
      >
       <div className="flex-1">
        <p className="font-semibold text-gray-900 dark:text-white">
         {assignment.employees?.full_name || 'Okänt namn'}
        </p>
        {assignment.employees?.email && (
         <p className="text-sm text-gray-500 dark:text-gray-400">
          {assignment.employees.email}
         </p>
        )}
        {assignment.employees?.role && (
         <p className="text-xs text-primary-500 dark:text-primary-400 mt-1">
          {assignment.employees.role}
         </p>
        )}
       </div>
       <button
        onClick={() => handleRemove(assignment.employee_id)}
        disabled={removing === assignment.employee_id}
        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
        title="Ta bort från projektet"
       >
        {removing === assignment.employee_id ? (
         <Loader className="w-5 h-5 animate-spin" />
        ) : (
         <X className="w-5 h-5" />
        )}
       </button>
      </div>
     ))}
    </div>
   ) : (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
     <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
      Inga anställda tilldelade ännu
     </p>
    </div>
   )}

   {/* Add Employee Form */}
   {unassignedEmployees.length > 0 ? (
    <div className="flex gap-3">
     <select
      value={selectedEmployeeId}
      onChange={(e) => setSelectedEmployeeId(e.target.value)}
      className="flex-1 px-4 py-2 rounded-lg border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
     >
      <option value="">Välj anställd...</option>
      {unassignedEmployees.map((emp) => (
       <option key={emp.id} value={emp.id}>
        {emp.full_name} {emp.email ? `(${emp.email})` : ''}
       </option>
      ))}
     </select>
     <button
      onClick={handleAssign}
      disabled={!selectedEmployeeId || assigning}
      className="px-6 py-2 bg-primary-500 hover:bg-primary-600 hover: hover: text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
     >
      {assigning ? (
       <>
        <Loader className="w-4 h-4 animate-spin" />
        Tilldelar...
       </>
      ) : (
       <>
        <Plus className="w-4 h-4" />
        Lägg till
       </>
      )}
     </button>
    </div>
   ) : (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
     <p className="text-sm text-purple-800 dark:text-purple-200 text-center">
      Alla tillgängliga anställda är redan tilldelade till projektet
     </p>
    </div>
   )}
  </div>
 )
}

