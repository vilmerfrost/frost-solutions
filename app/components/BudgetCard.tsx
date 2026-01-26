'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { BASE_PATH } from '@/utils/url'

interface BudgetCardProps {
 projectId: string
 tenantId: string
}

interface Budget {
 id: string
 budget_hours: number
 budget_material: number
 budget_total: number
 alert_thresholds: Array<{ percentage: number; notify: boolean }>
}

interface BudgetUsage {
 budget_hours: number
 budget_material: number
 budget_total: number
 used_hours: number
 used_material: number
 used_total: number
 hours_percentage: number
 material_percentage: number
 total_percentage: number
}

interface BudgetAlert {
 id: string
 alert_type: 'hours' | 'material' | 'total'
 threshold_percentage: number
 current_percentage: number
 status: 'active' | 'acknowledged' | 'resolved'
 created_at: string
}

export default function BudgetCard({ projectId, tenantId }: BudgetCardProps) {
 const [budget, setBudget] = useState<Budget | null>(null)
 const [usage, setUsage] = useState<BudgetUsage | null>(null)
 const [alerts, setAlerts] = useState<BudgetAlert[]>([])
 const [loading, setLoading] = useState(true)
 const [showSetBudget, setShowSetBudget] = useState(false)
 const [formData, setFormData] = useState({
  budget_hours: '',
  budget_material: '',
 })

 useEffect(() => {
  fetchBudgetData()
 }, [projectId])

 const fetchBudgetData = async () => {
  try {
   // Fetch budget
   const budgetRes = await fetch(`${BASE_PATH}/api/projects/${projectId}/budget`)
   if (budgetRes.ok) {
    const budgetData = await budgetRes.json()
    setBudget(budgetData)
    setFormData({
     budget_hours: budgetData.budget_hours?.toString() || '',
     budget_material: budgetData.budget_material?.toString() || '',
    })
   }

   // Fetch usage
   const usageRes = await fetch(`${BASE_PATH}/api/projects/${projectId}/budget-usage`)
   if (usageRes.ok) {
    const usageData = await usageRes.json()
    setUsage(usageData)
   }

   // Fetch alerts
   const alertsRes = await fetch(`${BASE_PATH}/api/projects/${projectId}/budget-alerts`)
   if (alertsRes.ok) {
    const alertsData = await alertsRes.json()
    setAlerts(alertsData.alerts || [])
   }
  } catch (error: any) {
   console.error('Error fetching budget data:', error)
   toast.error('Kunde inte hämta budgetdata')
  } finally {
   setLoading(false)
  }
 }

 const handleSetBudget = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
   const response = await fetch(`${BASE_PATH}/api/projects/${projectId}/budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     budget_hours: formData.budget_hours ? parseFloat(formData.budget_hours) : undefined,
     budget_material: formData.budget_material ? parseFloat(formData.budget_material) : undefined,
    }),
   })

   if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to set budget')
   }

   toast.success('Budget satt')
   setShowSetBudget(false)
   fetchBudgetData()
  } catch (error: any) {
   console.error('Error setting budget:', error)
   toast.error(error.message || 'Kunde inte sätta budget')
  }
 }

 const handleAcknowledgeAlert = async (alertId: string) => {
  try {
   const response = await fetch(`${BASE_PATH}/api/budget-alerts/${alertId}/acknowledge`, {
    method: 'POST',
   })

   if (!response.ok) throw new Error('Failed to acknowledge alert')

   toast.success('Larm markerat som sett')
   fetchBudgetData()
  } catch (error: any) {
   console.error('Error acknowledging alert:', error)
   toast.error('Kunde inte markera larm')
  }
 }

 const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-yellow-500'
  return 'bg-green-500'
 }

 if (loading) {
  return <div className="p-4">Laddar budget...</div>
 }

 return (
  <div className="bg-white rounded-lg shadow p-6">
   <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">Budget & Larm</h2>
    <button
     onClick={() => setShowSetBudget(!showSetBudget)}
     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
     {showSetBudget ? 'Avbryt' : budget ? 'Uppdatera Budget' : 'Sätt Budget'}
    </button>
   </div>

   {showSetBudget && (
    <form onSubmit={handleSetBudget} className="mb-6 p-4 bg-gray-50 rounded">
     <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Budget Timmar</label>
      <input
       type="number"
       value={formData.budget_hours}
       onChange={(e) => setFormData({ ...formData, budget_hours: e.target.value })}
       className="w-full p-2 border rounded"
       step="0.1"
      />
     </div>
     <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Budget Material (kr)</label>
      <input
       type="number"
       value={formData.budget_material}
       onChange={(e) => setFormData({ ...formData, budget_material: e.target.value })}
       className="w-full p-2 border rounded"
       step="0.01"
      />
     </div>
     <button
      type="submit"
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
     >
      Spara Budget
     </button>
    </form>
   )}

   {budget && usage && (
    <div className="space-y-4">
     <div>
      <div className="flex justify-between mb-1">
       <span className="text-sm font-medium">Timmar</span>
       <span className="text-sm">
        {usage.used_hours.toFixed(1)}h / {budget.budget_hours.toFixed(1)}h (
        {usage.hours_percentage.toFixed(1)}%)
       </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
       <div
        className={`h-2 rounded-full ${getProgressColor(usage.hours_percentage)}`}
        style={{ width: `${Math.min(usage.hours_percentage, 100)}%` }}
       />
      </div>
     </div>

     <div>
      <div className="flex justify-between mb-1">
       <span className="text-sm font-medium">Material</span>
       <span className="text-sm">
        {usage.used_material.toLocaleString('sv-SE')} kr /{' '}
        {budget.budget_material.toLocaleString('sv-SE')} kr ({usage.material_percentage.toFixed(1)}%)
       </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
       <div
        className={`h-2 rounded-full ${getProgressColor(usage.material_percentage)}`}
        style={{ width: `${Math.min(usage.material_percentage, 100)}%` }}
       />
      </div>
     </div>

     <div>
      <div className="flex justify-between mb-1">
       <span className="text-sm font-medium">Totalt</span>
       <span className="text-sm">
        {usage.used_total.toLocaleString('sv-SE')} kr /{' '}
        {budget.budget_total.toLocaleString('sv-SE')} kr ({usage.total_percentage.toFixed(1)}%)
       </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
       <div
        className={`h-2 rounded-full ${getProgressColor(usage.total_percentage)}`}
        style={{ width: `${Math.min(usage.total_percentage, 100)}%` }}
       />
      </div>
     </div>
    </div>
   )}

   {alerts.length > 0 && (
    <div className="mt-6">
     <h3 className="font-semibold mb-2">Aktiva Larm</h3>
     <div className="space-y-2">
      {alerts
       .filter((a) => a.status === 'active')
       .map((alert) => (
        <div
         key={alert.id}
         className="p-3 bg-yellow-50 border border-yellow-200 rounded flex justify-between items-center"
        >
         <div>
          <p className="font-medium">
           {alert.alert_type === 'hours'
            ? 'Timmar'
            : alert.alert_type === 'material'
            ? 'Material'
            : 'Totalt'}
           : {alert.current_percentage.toFixed(1)}% (Tröskel: {alert.threshold_percentage}%)
          </p>
          <p className="text-sm text-gray-600">
           {new Date(alert.created_at).toLocaleDateString('sv-SE')}
          </p>
         </div>
         <button
          onClick={() => handleAcknowledgeAlert(alert.id)}
          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
         >
          Markera som sett
         </button>
        </div>
       ))}
     </div>
    </div>
   )}
  </div>
 )
}

