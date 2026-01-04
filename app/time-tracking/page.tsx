// app/time-tracking/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { DatePicker } from '@/components/ui/date-picker'
import { OBTypeSelector, type OBType } from '@/components/time/OBTypeSelector'
import { TimeRangePicker } from '@/components/forms/TimeRangePicker'
import { PillSelector } from '@/components/forms/PillSelector'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/forms/FormSection'
import { CalculationBox } from '@/components/forms/CalculationBox'
import { Clock } from 'lucide-react'

export default function TimeTrackingPage() {
 const router = useRouter()
 const [date, setDate] = useState(new Date().toISOString().split('T')[0])
 const [obType, setObType] = useState<OBType>('work')
 const [startTime, setStartTime] = useState('07:00')
 const [endTime, setEndTime] = useState('16:00')
 const [breakDuration, setBreakDuration] = useState('30 min')
 const [projectId, setProjectId] = useState('')
 const [employeeId, setEmployeeId] = useState('')
 const [comments, setComments] = useState('')
 const [projects, setProjects] = useState<any[]>([])
 const [employees, setEmployees] = useState<any[]>([])
 const [loading, setLoading] = useState(false)

 // Calculate total hours
 const calculateHours = () => {
  if (!startTime || !endTime) return { total: 0, ob: 0 }
  
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  let totalMinutes = endMinutes - startMinutes
  if (totalMinutes < 0) totalMinutes += 24 * 60 // Handle overnight
  
  // Subtract break
  const breakMinutes = breakDuration === '30 min' ? 30 : breakDuration === '60 min' ? 60 : 0
  totalMinutes -= breakMinutes
  
  const totalHours = Math.max(0, totalMinutes / 60)
  
  // Calculate OB hours (simplified logic)
  let obHours = 0
  if (obType !== 'work' && obType !== 'sick' && obType !== 'vab' && obType !== 'vacation' && obType !== 'absence') {
   obHours = totalHours // All hours are OB for OB types
  }
  
  return { total: totalHours, ob: obHours }
 }

 const { total: totalHours, ob: obHours } = calculateHours()

 // Fetch projects and employees on mount
 useEffect(() => {
  const fetchData = async () => {
   try {
    const [projectsRes, employeesRes] = await Promise.all([
     fetch('/api/projects/list'),
     fetch('/api/employees')
    ])
    
    if (projectsRes.ok) {
     const projectsData = await projectsRes.json()
     setProjects(projectsData.projects || [])
    }
    
    if (employeesRes.ok) {
     const employeesData = await employeesRes.json()
     setEmployees(employeesData.employees || [])
    }
   } catch (error) {
    console.error('Error fetching data:', error)
   }
  }
  
  fetchData()
 }, [])

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
   const response = await fetch('/api/time-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     date,
     obType,
     startTime,
     endTime,
     breakDuration,
     projectId,
     employeeId,
     comments,
     hoursTotal: totalHours,
     obHours,
    }),
   })

   if (response.ok) {
    // Success - redirect to dashboard
    router.push('/dashboard')
   } else {
    alert('Kunde inte spara tidrapporten. Försök igen.')
   }
  } catch (error) {
   console.error('Error saving time entry:', error)
   alert('Ett fel uppstod. Försök igen.')
  } finally {
   setLoading(false)
  }
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
     {/* Header */}
     <div className="mb-8">
      <button
       onClick={() => router.back()}
       className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 flex items-center gap-2"
      >
       ← Tillbaka
      </button>
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
       Tidrapportering
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
       Registrera arbetstid och OB-tillägg
      </p>
     </div>

     {/* Form */}
     <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-6 space-y-6">
       <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Snabbrapportering
       </h2>

       {/* Date */}
       <DatePicker
        label="Datum"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
       />

       {/* OB Type Selector */}
       <OBTypeSelector
        label="Typ av tid"
        value={obType}
        onChange={setObType}
        required
       />

       {/* Time Range */}
       <TimeRangePicker
        startLabel="Start"
        endLabel="Slut"
        startValue={startTime}
        endValue={endTime}
        onStartChange={setStartTime}
        onEndChange={setEndTime}
        required
       />

       {/* Break */}
       <PillSelector
        label="Rast"
        options={['Ingen', '30 min', '60 min']}
        value={breakDuration}
        onChange={setBreakDuration}
       />

       {/* Project */}
       <Select
        label="Projekt"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        required
       >
        <option value="">Välj projekt...</option>
        {projects.map((project) => (
         <option key={project.id} value={project.id}>
          {project.name}
         </option>
        ))}
       </Select>

       {/* Employee */}
       <Select
        label="Anställd"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        required
       >
        <option value="">Välj anställd...</option>
        {employees.map((employee) => (
         <option key={employee.id} value={employee.id}>
          {employee.name}
         </option>
        ))}
       </Select>

       {/* Comments */}
       <Textarea
        label="Kommentar (valfritt)"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Beskriv vad som utfördes..."
       />

       {/* Calculation */}
       <CalculationBox
        title={null}
        items={[
         { label: `${startTime} - ${endTime} med ${breakDuration} rast`, value: `= ${totalHours.toFixed(1)}h` },
         { label: 'OB-tillägg', value: `${obHours > 0 ? obHours.toFixed(1) : 'Ingen'} OB`, icon: obHours > 0 ? '🌙' : undefined },
         { label: 'Totalt', value: `${totalHours.toFixed(1)}h`, highlight: true, icon: '⏰' },
        ]}
        footer="Kontrollera att tiderna stämmer innan du sparar"
       />

       {/* Actions */}
       <div className="flex gap-3 pt-4">
        <Button
         type="submit"
         variant="primary"
         loading={loading}
         className="flex-1"
        >
         Spara tidrapport
        </Button>
        <Button
         type="button"
         variant="secondary"
         onClick={() => router.back()}
         disabled={loading}
        >
         Avbryt
        </Button>
       </div>
      </div>
     </form>

     {/* Recent entries could go here */}
    </div>
   </main>
  </div>
 )
}

