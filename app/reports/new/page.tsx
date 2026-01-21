'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import DatePicker from '@/components/DatePicker'
import WorkTypeSelector from '@/components/WorkTypeSelector'
import TimeRangePicker from '@/components/TimeRangePicker'
import CompanySelector from '@/components/CompanySelector'
import EmployeeSelector from '@/components/EmployeeSelector'
import CommentBox from '@/components/CommentBox'
import TimeClock from '@/components/TimeClock'
import { checkTimeOverlap, formatDuplicateMessage } from '@/lib/duplicateCheck'
import { useAdmin } from '@/hooks/useAdmin'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { addToOfflineQueue, getPendingTimeEntries, syncPendingTimeEntries } from '@/lib/offline/timeEntriesQueue'
import supabase from '@/utils/supabase/supabaseClient'

export default function NewReportPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 
 // Catch any unhandled errors to prevent JSON display
 useEffect(() => {
  const handleError = (event: ErrorEvent) => {
   // Prevent 503 errors from being displayed
   if (
    event.message?.includes('503') ||
    event.message?.includes('Service Unavailable') ||
    event.message?.includes('Offline och ingen cache') ||
    event.error?.message?.includes('Offline och ingen cache') ||
    event.filename?.includes('reports/new')
   ) {
    event.preventDefault()
    console.warn('Caught offline/503 error, preventing display:', event.message)
    setFetchError('offline')
   }
  }
  
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
   // Prevent unhandled promise rejections from crashing the page
   if (
    event.reason?.message?.includes('503') ||
    event.reason?.message?.includes('Service Unavailable') ||
    event.reason?.message?.includes('Failed to fetch') ||
    event.reason?.message?.includes('network')
   ) {
    event.preventDefault()
    console.warn('Caught unhandled rejection (likely offline):', event.reason)
    setFetchError('offline')
   }
  }
  
  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  
  return () => {
   window.removeEventListener('error', handleError)
   window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }
 }, [])
 const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
 const [start, setStart] = useState('07:00')
 const [end, setEnd] = useState('16:00')
 const [project, setProject] = useState('')
 const [type, setType] = useState('work')
 const [notes, setNotes] = useState('')
 const [employeeId, setEmployeeId] = useState('')
 const [hours, setHours] = useState(0)
 const [saving, setSaving] = useState(false)
 const [projects, setProjects] = useState<{ id: string, name: string }[]>([])
 const [employees, setEmployees] = useState<{ id: string, name: string }[]>([])
 const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
 const [multiProjectMode, setMultiProjectMode] = useState(false)
 const [projectEntries, setProjectEntries] = useState<Array<{ projectId: string, hours: number }>>([{ projectId: '', hours: 0 }])
 const [breakMinutes, setBreakMinutes] = useState(0)
 const [isOnline, setIsOnline] = useState<boolean>(true)
 const [fetchError, setFetchError] = useState<string | null>(null)
 const [isMounted, setIsMounted] = useState(false)
 const { isAdmin } = useAdmin()
 
 // Track pending offline entries
 const [pendingCount, setPendingCount] = useState(0)
 
 // Kontrollera om typen kräver tidsfält
 const requiresTimeFields = !['vabb', 'sick', 'vacation', 'absence'].includes(type)
 
 // Mark component as mounted to prevent hydration issues
 useEffect(() => {
  setIsMounted(true)
 }, [])

 // Update pending count
 useEffect(() => {
  if (typeof window === 'undefined') return
  const updatePendingCount = () => {
   setPendingCount(getPendingTimeEntries().length)
  }
  updatePendingCount()
  // Update every 2 seconds to catch changes
  const interval = setInterval(updatePendingCount, 2000)
  return () => clearInterval(interval)
 }, [])

 // Auto-sync pending time entries when coming online
 useEffect(() => {
  if (typeof window === 'undefined' || isOnline !== true || !tenantId) return

  const handleOnline = async () => {
   if (!tenantId) {
    console.warn('⚠️ Cannot sync: tenantId is missing')
    return
   }

   const pending = getPendingTimeEntries()
   if (pending.length === 0) {
    console.log('✅ No pending entries to sync')
    setPendingCount(0)
    return
   }

   console.log(`🔄 Syncing ${pending.length} pending time entries...`)
   const result = await syncPendingTimeEntries(tenantId)
   
   console.log('📊 Sync result:', result)
   
   if (result.synced > 0) {
    toast.success(`${result.synced} tidsrapporter synkade!`)
   }
   if (result.failed > 0) {
    toast.error(`${result.failed} tidsrapporter kunde inte synkas. Försök igen senare.`)
   }
   
   // Update pending count after sync
   setPendingCount(getPendingTimeEntries().length)
  }

  // Sync immediately if online and we have pending entries
  if (isOnline === true && tenantId) {
   const pending = getPendingTimeEntries()
   if (pending.length > 0) {
    handleOnline()
   }
  }

  // Listen for online events
  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
 }, [isOnline, tenantId])
 
 // Offline/online detection - initialize immediately to prevent hydration issues
 useEffect(() => {
  if (typeof window === 'undefined') {
   setIsOnline(true) // Assume online on server
   return
  }
  
  // Set initial state immediately
  const initialOnline = navigator.onLine
  setIsOnline(initialOnline)
  
  // If offline initially, set error state
  if (!initialOnline) {
   // Check if we have any cached data
   const hasCache = 
    localStorage.getItem('currentEmployeeId') ||
    localStorage.getItem(`projects:${tenantId}`) ||
    localStorage.getItem(`employees:${tenantId}`)
   
   if (!hasCache) {
    setFetchError('offline')
   }
  }
  
  const handleOnline = () => {
   setIsOnline(true)
   setFetchError(null) // Clear error when coming back online
  }
  const handleOffline = () => {
   setIsOnline(false)
   // Only set error if no cache available
   const hasCache = 
    localStorage.getItem('currentEmployeeId') ||
    localStorage.getItem(`projects:${tenantId}`) ||
    localStorage.getItem(`employees:${tenantId}`)
   
   if (!hasCache) {
    setFetchError('offline')
   }
  }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
   window.removeEventListener('online', handleOnline)
   window.removeEventListener('offline', handleOffline)
  }
 }, [tenantId])
 
 // Hämta current employee ID för TimeClock
 useEffect(() => {
  async function fetchCurrentEmployee() {
   // Wait for isOnline to be determined
   if (isOnline === null) return
   
   // Also fetch and cache userId when online (or try Supabase client which works offline)
   // Try Supabase client first (works offline if session exists)
   try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!userError && user?.id) {
     try {
      localStorage.setItem('cachedUserId', user.id)
      console.log('✅ Cached userId on page load (Supabase):', user.id)
     } catch (err) {
      console.warn('Could not cache userId:', err)
     }
    }
   } catch (err) {
    console.warn('Supabase getUser failed on page load:', err)
   }
   
   // Also try API route if online (as backup)
   if (isOnline !== false) {
    try {
     const userRes = await fetch('/api/auth/user', { cache: 'no-store' })
     if (userRes.ok) {
      const userData = await userRes.json()
      const userId = userData.userId || userData.id
      if (userId) {
       try {
        localStorage.setItem('cachedUserId', userId)
        console.log('✅ Cached userId on page load (API):', userId)
       } catch (err) {
        console.warn('Could not cache userId:', err)
       }
      }
     }
    } catch (err) {
     console.warn('Could not fetch userId on page load:', err)
    }
   }
   
   if (isOnline === false) {
    // Offline - försök läsa från cache
    try {
     const cached = localStorage.getItem('currentEmployeeId')
     if (cached) {
      const data = JSON.parse(cached)
      if (data.employeeId) {
       setCurrentEmployeeId(data.employeeId)
       if (!employeeId) {
        setEmployeeId(data.employeeId)
       }
      }
     }
    } catch (err) {
     console.warn('Could not read cached employee ID:', err)
    }
    return
   }
   
   try {
    const res = await fetch('/api/employee/get-current', { cache: 'no-store' })
    if (res.ok) {
     const data = await res.json()
     if (data.employeeId) {
      setCurrentEmployeeId(data.employeeId)
      // Cache för offline-användning
      try {
       localStorage.setItem('currentEmployeeId', JSON.stringify(data))
      } catch (err) {
       console.warn('Could not cache employee ID:', err)
      }
      // Auto-fyll employeeId om den är tom
      if (!employeeId) {
       setEmployeeId(data.employeeId)
      }
     }
    } else {
     // API returnerade fel - försök cache
     let errorText = ''
     try {
      errorText = await res.text()
      console.warn('API returned error, trying cache:', errorText)
     } catch (textErr) {
      console.warn('Could not read error text:', textErr)
     }
     
     // Ignorera felmeddelandet och försök cache
     try {
      const cached = localStorage.getItem('currentEmployeeId')
      if (cached) {
       const data = JSON.parse(cached)
       if (data.employeeId) {
        setCurrentEmployeeId(data.employeeId)
        if (!employeeId) {
         setEmployeeId(data.employeeId)
        }
       }
      }
     } catch (cacheErr) {
      console.warn('Could not read cached employee ID:', cacheErr)
     }
    }
   } catch (err: any) {
    // Fetch misslyckades (t.ex. offline) - försök cache
    console.warn('Fetch failed (likely offline), trying cache:', err.message)
    // Don't set fetchError here - we'll try cache first
    try {
     const cached = localStorage.getItem('currentEmployeeId')
     if (cached) {
      const data = JSON.parse(cached)
      if (data.employeeId) {
       setCurrentEmployeeId(data.employeeId)
       if (!employeeId) {
        setEmployeeId(data.employeeId)
       }
       // Successfully loaded from cache - clear error
       setFetchError(null)
      } else {
       // No cache available
       if (!isOnline) {
        setFetchError('offline')
       }
      }
     } else {
      // No cache available
      if (!isOnline) {
       setFetchError('offline')
      }
     }
    } catch (cacheErr) {
     console.warn('Could not read cached employee ID:', cacheErr)
     if (!isOnline) {
      setFetchError('offline')
     }
    }
   }
  }
  fetchCurrentEmployee()
 }, [isOnline])
 
 async function fetchData() {
  if (!tenantId) return
  
  // Wait for isOnline to be determined
  if (isOnline === null) return
  
  // Offline handling - läs från cache
  if (isOnline === false) {
   try {
    const cachedProjects = localStorage.getItem(`projects:${tenantId}`)
    const cachedEmployees = localStorage.getItem(`employees:${tenantId}`)
    
    if (cachedProjects) {
     const projectsData = JSON.parse(cachedProjects)
     setProjects(projectsData.projects || [])
    }
    
    if (cachedEmployees) {
     const employeesData = JSON.parse(cachedEmployees)
     setEmployees(employeesData.employees || [])
    }
   } catch (err) {
    console.warn('Could not read cached data:', err)
   }
   return
  }
  
  // Fetch projects via API route (same as TimeClock) for consistency
  try {
   const projectsRes = await fetch('/api/projects/for-timeclock', { cache: 'no-store' })
   if (projectsRes.ok) {
    const projectsData = await projectsRes.json()
    if (projectsData.projects) {
     setProjects(projectsData.projects)
     // Cache för offline-användning
     try {
      localStorage.setItem(`projects:${tenantId}`, JSON.stringify({ projects: projectsData.projects }))
     } catch (err) {
      console.warn('Could not cache projects:', err)
     }
    } else {
     setProjects([])
    }
   } else {
    // API returnerade fel - försök cache (ignorera felmeddelandet)
    let errorText = ''
    try {
     errorText = await projectsRes.text()
     console.warn('Projects API returned error, trying cache:', errorText.substring(0, 100))
    } catch (textErr) {
     console.warn('Could not read error text:', textErr)
    }
    
    // Ignorera felmeddelandet och försök cache
    try {
     const cached = localStorage.getItem(`projects:${tenantId}`)
     if (cached) {
      const projectsData = JSON.parse(cached)
      setProjects(projectsData.projects || [])
     } else {
      setProjects([])
     }
    } catch (err) {
     console.warn('Could not read cached projects:', err)
     setProjects([])
    }
   }
  } catch (err: any) {
   // Fetch misslyckades (t.ex. offline) - försök cache
   console.warn('Projects fetch failed (likely offline), trying cache:', err.message)
   try {
    const cached = localStorage.getItem(`projects:${tenantId}`)
    if (cached) {
     const projectsData = JSON.parse(cached)
     setProjects(projectsData.projects || [])
     // Successfully loaded from cache - don't set error
    } else {
     setProjects([])
     // No cache available
     if (isOnline === false && projects.length === 0) {
      setFetchError('offline')
     }
    }
   } catch (cacheErr) {
    console.warn('Could not read cached projects:', cacheErr)
    setProjects([])
    if (isOnline === false) {
     setFetchError('offline')
    }
   }
  }
  
  // Fetch employees via API route
  try {
   const employeesRes = await fetch(`/api/employees/list?tenantId=${tenantId}`, { cache: 'no-store' })
   if (employeesRes.ok) {
    const employeesData = await employeesRes.json()
    const employeesList = employeesData.employees || []
    setEmployees(employeesList.map((e: any) => ({
     id: e.id,
     name: e.full_name || e.name || 'Okänd'
    })))
    // Cache för offline-användning
    try {
     localStorage.setItem(`employees:${tenantId}`, JSON.stringify({ employees: employeesList }))
    } catch (err) {
     console.warn('Could not cache employees:', err)
    }
   } else {
    // API returnerade fel - försök cache (ignorera felmeddelandet)
    let errorText = ''
    try {
     errorText = await employeesRes.text()
     console.warn('Employees API returned error, trying cache:', errorText.substring(0, 100))
    } catch (textErr) {
     console.warn('Could not read error text:', textErr)
    }
    
    // Ignorera felmeddelandet och försök cache
    try {
     const cached = localStorage.getItem(`employees:${tenantId}`)
     if (cached) {
      const employeesData = JSON.parse(cached)
      const employeesList = employeesData.employees || []
      setEmployees(employeesList.map((e: any) => ({
       id: e.id,
       name: e.full_name || e.name || 'Okänd'
      })))
     } else {
      setEmployees([])
     }
    } catch (err) {
     console.warn('Could not read cached employees:', err)
     setEmployees([])
    }
   }
  } catch (err: any) {
   // Fetch misslyckades (t.ex. offline) - försök cache
   console.warn('Employees fetch failed (likely offline), trying cache:', err.message)
   try {
    const cached = localStorage.getItem(`employees:${tenantId}`)
    if (cached) {
     const employeesData = JSON.parse(cached)
     const employeesList = employeesData.employees || []
     setEmployees(employeesList.map((e: any) => ({
      id: e.id,
      name: e.full_name || e.name || 'Okänd'
     })))
     // Successfully loaded from cache - don't set error
    } else {
     setEmployees([])
     // No cache available
     if (isOnline === false && employees.length === 0) {
      setFetchError('offline')
     }
    }
   } catch (cacheErr) {
    console.warn('Could not read cached employees:', cacheErr)
    setEmployees([])
    if (isOnline === false) {
     setFetchError('offline')
    }
   }
  }
 }
 
 useEffect(() => { 
  fetchData() 
 }, [tenantId, isOnline])

 // Auto-fyll tider när typ ändras
 useEffect(() => {
  if (type === 'night') {
   setStart('22:00')
   setEnd('06:00')
  } else if (!requiresTimeFields) {
   // För VABB/frånvaro/sjuk - sätt 8 timmar automatiskt
   setHours(8)
  }
 }, [type])

 // Beräkna timmar från start/end när tidsfält används (minus rast)
 useEffect(() => {
  if (requiresTimeFields && start && end && !multiProjectMode) {
   const [h1, m1] = start.split(':').map(Number)
   const [h2, m2] = end.split(':').map(Number)
   let hrs = (h2 + m2 / 60) - (h1 + m1 / 60)
   if (hrs <= 0) hrs += 24 // Hantera över midnatt (för nattarbete)
   const totalHours = Math.max(0, hrs - (breakMinutes / 60))
   setHours(totalHours)
  }
 }, [start, end, requiresTimeFields, breakMinutes, multiProjectMode])
 
 // När multi-projekt aktiveras, sätt timmar baserat på summan av projekt entries
 useEffect(() => {
  if (multiProjectMode) {
   const total = projectEntries.reduce((sum, entry) => sum + entry.hours, 0)
   setHours(total)
  }
 }, [projectEntries, multiProjectMode])
 
 // Beräkna totala timmar för multi-projekt läge
 const totalMultiProjectHours = projectEntries.reduce((sum, entry) => sum + entry.hours, 0)

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  // Don't block if online status is unknown (null) - assume online
  // Only block if explicitly offline
  if (isOnline === false) {
   // This should not happen anymore since we save offline, but keep as safety
   console.log('Offline detected, saving to queue...')
  }
  
  setSaving(true)

  // Get user ID - prioritize offline methods first, then online API
  let userId: string | null = null
  
  // Strategy 1: Try Supabase client directly (works offline if session exists)
  try {
   const { data: { user }, error: userError } = await supabase.auth.getUser()
   if (!userError && user?.id) {
    userId = user.id
    console.log('✅ Got userId from Supabase client:', userId)
    // Cache for future offline use
    try {
     localStorage.setItem('cachedUserId', userId)
    } catch (err) {
     console.warn('Could not cache userId:', err)
    }
   }
  } catch (err) {
   console.warn('Supabase client getUser failed:', err)
  }
  
  // Strategy 2: Try cache (for offline scenarios)
  if (!userId) {
   try {
    const cachedUserId = localStorage.getItem('cachedUserId')
    if (cachedUserId) {
     userId = cachedUserId
     console.log('✅ Using cached userId:', userId)
    }
   } catch (err) {
    console.warn('Could not read cached userId:', err)
   }
  }
  
  // Strategy 3: Try API route (only if online and still no userId)
  if (!userId && isOnline !== false) {
   try {
    const userRes = await fetch('/api/auth/user', { cache: 'no-store' })
    if (userRes.ok) {
     const userData = await userRes.json()
     userId = userData.userId || userData.id
     if (userId) {
      // Cache for offline use
      try {
       localStorage.setItem('cachedUserId', userId)
       console.log('✅ Cached userId from API:', userId)
      } catch (err) {
       console.warn('Could not cache userId:', err)
      }
     }
    }
   } catch (err) {
    console.warn('API fetch failed (will use cache if available):', err)
   }
  }
  
  // Strategy 4: Final fallback - try cache one more time
  if (!userId) {
   try {
    const cachedUserId = localStorage.getItem('cachedUserId')
    if (cachedUserId) {
     userId = cachedUserId
     console.log('✅ Using cached userId as final fallback:', userId)
    }
   } catch (err) {
    console.warn('Could not read cached userId:', err)
   }
  }

  if (!userId) {
   toast.error('Du är inte inloggad. Logga in igen.')
   setSaving(false)
   return
  }

  // Validera projekt beroende på läge
  if (requiresTimeFields) {
   if (multiProjectMode) {
    // Filtrera bort tomma entries
    const validEntries = projectEntries.filter(e => e.projectId && e.hours > 0)
    if (validEntries.length === 0) {
     toast.error('Du måste lägga till minst ett projekt med timmar!')
     setSaving(false)
     return
    }
    // Validera att alla valda entries har projekt och timmar
    const invalidEntries = projectEntries.filter(e => e.projectId && e.hours <= 0)
    if (invalidEntries.length > 0) {
     toast.error('Alla projekt måste ha timmar fördelade!')
     setSaving(false)
     return
    }
    if (totalMultiProjectHours <= 0) {
     toast.error('Totalt antal timmar måste vara större än 0!')
     setSaving(false)
     return
    }
   } else {
    if (!project) {
     toast.error('Projekt måste väljas för arbetstidrapporter!')
     setSaving(false)
     return
    }
    if (hours <= 0) {
     toast.error('Totalt antal timmar måste vara större än 0!')
     setSaving(false)
     return
    }
   }
  }
  
  if (!employeeId) { 
   toast.error('Anställd måste väljas!')
   setSaving(false)
   return
  }

  // Mappning av gamla typer till nya
  const obTypeMap: Record<string, string> = {
   'natt': 'night',
   'kväll': 'evening',
   'helg': 'weekend',
   'sjuk': 'sick',
   'vabb': 'vabb',
   'frånvaro': 'absence',
  }
  
  const ob_type = obTypeMap[type] || type

  // Beräkna amount_total baserat på employee's base_rate och OB-tillägg (byggkollektivavtalet)
  let amount_total = 0
  if (requiresTimeFields && employeeId && tenantId) {
   // Hämta employee's base_rate via API route
   let baseRate = 360 // Default fallback
   try {
    const rateRes = await fetch(`/api/employee/rate?employeeId=${employeeId}`, { cache: 'no-store' })
    if (rateRes.ok) {
     const rateData = await rateRes.json()
     baseRate = Number(rateData.baseRate || rateData.defaultRate || 360)
    } else {
     console.warn('Could not fetch employee rate via API, using default.')
    }
   } catch (err) {
    console.warn('Error fetching employee rate:', err)
    // Use default rate
   }
   
   // Byggkollektivavtalet:
   // - Vanlig tid (work): 100% = 1.0x
   // - OB Kväll/Natt (evening/night): 150% = 1.5x
   // - OB Helg (weekend): 200% = 2.0x
   let multiplier = 1.0
   if (ob_type === 'evening' || ob_type === 'night') {
    multiplier = 1.5 // 150%
   } else if (ob_type === 'weekend') {
    multiplier = 2.0 // 200%
   }
   
   amount_total = hours * baseRate * multiplier
  }

  // Build insert payload - try with description first, fallback without it
  const basePayload: any = {
   user_id: userId,
   tenant_id: tenantId,
   employee_id: employeeId,
   project_id: requiresTimeFields ? project : null, // Ingen projekt för VABB/frånvaro
   date,
   start_time: requiresTimeFields ? start : null,
   end_time: requiresTimeFields ? end : null,
   break_minutes: breakMinutes,
   ob_type,
   hours_total: hours,
   amount_total: Math.round(amount_total * 100) / 100, // Avrunda till 2 decimaler
   is_billed: false,
  }

  // Add description if provided
  if (notes && notes.trim()) {
   basePayload.description = notes.trim()
  }

  if (!tenantId) {
   toast.error('Ingen tenant vald')
   setSaving(false)
   return
  }

  // 🔍 DUBBLETT-KONTROLL: Kontrollera om det redan finns en liknande tidsrapport via API (endast om online)
  if (isOnline !== false) {
   try {
    const checkRes = await fetch(`/api/time-entries/list?tenantId=${tenantId}&employeeId=${employeeId}&date=${date}`, {
     cache: 'no-store',
    })
    
    if (checkRes.ok) {
     const checkData = await checkRes.json()
     const existingEntries = checkData.timeEntries || []
    
    if (existingEntries.length > 0) {
     // Kontrollera överlappning
     const isDuplicate = checkTimeOverlap(
      {
       employee_id: employeeId,
       project_id: basePayload.project_id,
       date,
       start_time: basePayload.start_time,
       end_time: basePayload.end_time,
       tenant_id: tenantId,
      },
      existingEntries
     )

     if (isDuplicate) {
      const duplicateMsg = formatDuplicateMessage(existingEntries[0])
      const confirmed = window.confirm(
       `⚠️ ${duplicateMsg}\n\nVill du ändå spara denna tidsrapport?`
      )
      
      if (!confirmed) {
       setSaving(false)
       return
      }
     }
    }
   } else {
    console.warn('Could not check for duplicates:', await checkRes.text())
    // Fortsätt ändå - bättre att försöka spara än att blockera
   }
   } catch (dupCheckErr) {
    console.error('Error in duplicate check:', dupCheckErr)
    // Fortsätt ändå - låt användaren spara
   }
  } else {
   // Offline: hoppa över duplicate check
   console.log('Offline: Skipping duplicate check')
  }

  // Helper function to save offline
  const saveOffline = (payload: any) => {
   try {
    console.log('💾 Saving to offline queue:', payload)
    const offlineEntry = {
     tenant_id: payload.tenant_id,
     employee_id: payload.employee_id,
     project_id: payload.project_id,
     date: payload.date,
     start_time: payload.start_time,
     end_time: payload.end_time,
     hours_total: payload.hours_total,
     ob_type: payload.ob_type,
     amount_total: payload.amount_total,
     is_billed: payload.is_billed,
     break_minutes: payload.break_minutes,
     comment: payload.description || null,
     work_type: payload.ob_type || null,
    }
    
    addToOfflineQueue(offlineEntry)
    console.log('✅ Saved to offline queue successfully')
    return true
   } catch (error) {
    console.error('❌ Error saving offline:', error)
    return false
   }
  }

  // Determine if we should try online first (if online status is true or null)
  const shouldTryOnline = isOnline !== false // true or null = try online first
  
  console.log('📊 Submit state:', { isOnline, shouldTryOnline, multiProjectMode })

  // Om multi-projekt läge, skapa flera time entries
  if (multiProjectMode && requiresTimeFields) {
   let successCount = 0
   let errorCount = 0
   let offlineCount = 0
   
   for (const entry of projectEntries) {
    if (!entry.projectId || entry.hours <= 0) continue
    
    const entryPayload = {
     ...basePayload,
     project_id: entry.projectId,
     hours_total: entry.hours,
     start_time: null, // Multi-projekt har inga tider
     end_time: null,
     break_minutes: 0, // Rast räknas inte per projekt
     // Beräkna amount för detta projekt baserat på dess timmar
     amount_total: Math.round((entry.hours / (hours || 1)) * amount_total * 100) / 100,
    }
    
    // Om offline, spara direkt till queue
    if (isOnline === false) {
     console.log('📴 Offline: Saving to queue')
     if (saveOffline(entryPayload)) {
      offlineCount++
     } else {
      errorCount++
     }
     continue
    }
    
    // Om online eller unknown, försök spara direkt först
    if (shouldTryOnline) {
     try {
      console.log('🌐 Online: Attempting direct save')
      const response = await fetch('/api/time-entries/create', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(entryPayload),
      })
      
      const result = await response.json()
      
      if (!response.ok || result.error) {
       // Om det misslyckas, spara offline istället
       console.log('⚠️ Direct save failed, saving offline:', result.error)
       if (saveOffline(entryPayload)) {
        offlineCount++
       } else {
        errorCount++
       }
      } else {
       console.log('✅ Direct save successful')
       successCount++
      }
     } catch (err) {
      // Nätverksfel - spara offline
      console.log('❌ Network error, saving offline:', err)
      if (saveOffline(entryPayload)) {
       offlineCount++
      } else {
       errorCount++
      }
     }
    } else {
     // Fallback: spara offline om shouldTryOnline är false
     if (saveOffline(entryPayload)) {
      offlineCount++
     } else {
      errorCount++
     }
    }
   }
   
   if (offlineCount > 0) {
    toast.success(`${offlineCount} tidsrapporter sparade offline och synkas när du är online igen!`)
   } else if (errorCount > 0) {
    toast.error(`${successCount} av ${projectEntries.length} tidsrapporter sparades. ${errorCount} misslyckades.`)
   } else {
    toast.success(`${successCount} tidsrapporter sparade!`)
   }
   
   setSaving(false)
   router.push('/reports')
   return
  }
  
  // Single project mode - original logic
  // Om offline, spara direkt till queue
  if (isOnline === false) {
   console.log('📴 Offline: Saving single entry to queue')
   if (saveOffline(basePayload)) {
    toast.success('Tidsrapport sparad offline och synkas när du är online igen!')
    setSaving(false)
    router.push('/reports')
    return
   } else {
    toast.error('Kunde inte spara offline. Försök igen.')
    setSaving(false)
    return
   }
  }
  
  // Om online eller unknown, försök spara direkt först
  if (shouldTryOnline) {
   try {
    console.log('🌐 Online: Attempting direct save for single entry')
    const response = await fetch('/api/time-entries/create', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(basePayload),
    })

    const result = await response.json()

    if (!response.ok || result.error) {
     // Om det misslyckas, spara offline istället
     console.log('⚠️ Direct save failed, saving offline:', result.error)
     if (saveOffline(basePayload)) {
      toast.success('Tidsrapport sparad offline och synkas när du är online igen!')
      setSaving(false)
      router.push('/reports')
      return
     } else {
      toast.error('Kunde inte spara: ' + (result.error || result.message || 'Okänt fel'))
      setSaving(false)
      return
     }
    }
    
    console.log('✅ Direct save successful')
    toast.success('Tidsrapport sparad!')
    router.push('/reports')
   } catch (err) {
    // Nätverksfel - spara offline
    console.log('❌ Network error, saving offline:', err)
    if (saveOffline(basePayload)) {
     toast.success('Tidsrapport sparad offline och synkas när du är online igen!')
     setSaving(false)
     router.push('/reports')
    } else {
     toast.error('Kunde inte spara. Kontrollera din internetanslutning.')
     setSaving(false)
    }
   }
  } else {
   // Fallback: spara offline om shouldTryOnline är false
   console.log('📴 Fallback: Saving to queue')
   if (saveOffline(basePayload)) {
    toast.success('Tidsrapport sparad offline och synkas när du är online igen!')
    setSaving(false)
    router.push('/reports')
   } else {
    toast.error('Kunde inte spara offline. Försök igen.')
    setSaving(false)
   }
  }
 }

 // Don't render until mounted (prevents hydration issues)
 if (!isMounted) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
     <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
      <div className="mb-6 sm:mb-8">
       <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Ny tidsrapport</h1>
       <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Laddar...</p>
      </div>
     </div>
    </main>
   </div>
  )
 }

 // Don't render if we have a critical error (prevent JSON error display)
 if (fetchError === 'offline' || (fetchError && fetchError.includes('Offline och ingen cache'))) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
     <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
      <div className="mb-6 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-4 py-3">
       <div className="flex items-center gap-2">
        <span>📴</span>
        <span>Du är offline och ingen cachad data finns tillgänglig. Vänligen vänta tills du är online igen.</span>
       </div>
      </div>
     </div>
    </main>
   </div>
  )
 }

 return (
  <ErrorBoundary fallback={
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
     <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
      <div className="mb-6 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-4 py-3">
       <div className="flex items-center gap-2">
        <span>📴</span>
        <span>Du är offline. Vänligen vänta tills du är online igen.</span>
       </div>
      </div>
     </div>
    </main>
   </div>
  }>
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
     <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
      <div className="mb-6 sm:mb-8">
       <div className="flex items-center justify-between">
        <div>
         <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Ny tidsrapport</h1>
         <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Rapportera arbetstid eller frånvaro</p>
        </div>
        {pendingCount > 0 && (
         <div className="rounded-full bg-amber-500 text-white px-3 py-1 text-sm font-semibold">
          {pendingCount} väntar på synkning
         </div>
        )}
       </div>
      </div>

     {/* Time Clock - Snabb stämpling */}
     {currentEmployeeId && (
      <div className="mb-6 sm:mb-8">
       <TimeClock employeeId={currentEmployeeId} projects={projects} />
      </div>
     )}

     {/* Offline banner */}
     {isOnline === false && (
      <div className="mb-6 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-4 py-3 text-sm">
       <div className="flex items-center gap-2">
        <span>📴</span>
        <span>Offline – Du kan spara tidsrapporter offline. De synkas automatiskt när du är online igen.</span>
       </div>
      </div>
     )}
     
     {/* Error display if API fails */}
     {projects.length === 0 && employees.length === 0 && isOnline !== false && (
      <div className="mb-6 rounded-md border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-4 py-3 text-sm">
       <div className="flex items-center gap-2">
        <span>⚠️</span>
        <span>Kunde inte ladda projekt eller anställda. Kontrollera din internetanslutning och försök igen.</span>
       </div>
      </div>
     )}

     <div className="mb-6 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
       <div className="h-px w-8 bg-gray-300 dark:bg-gray-600"></div>
       <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">eller</span>
       <div className="h-px w-8 bg-gray-300 dark:bg-gray-600"></div>
      </div>
     </div>

     <form
      className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700"
      onSubmit={handleSubmit}
     >
      <div className="space-y-6">
       <DatePicker value={date} onChange={setDate} />
       
       <WorkTypeSelector value={type} onChange={setType} />
       
       {requiresTimeFields && !multiProjectMode ? (
        <>
         <TimeRangePicker start={start} end={end} setStart={setStart} setEnd={setEnd} />
         
         {/* Rast-knappar */}
         <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-[8px] border border-gray-200 dark:border-gray-600">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
           Rast
          </label>
          <div className="flex gap-2 flex-wrap">
           <button
            type="button"
            onClick={() => setBreakMinutes(breakMinutes === 30 ? 0 : 30)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
             breakMinutes === 30
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500'
            }`}
           >
            30 min
           </button>
           <button
            type="button"
            onClick={() => setBreakMinutes(breakMinutes === 60 ? 0 : 60)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
             breakMinutes === 60
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500'
            }`}
           >
            60 min
           </button>
           {breakMinutes > 0 && (
            <button
             type="button"
             onClick={() => setBreakMinutes(0)}
             className="px-4 py-2 rounded-lg font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50"
            >
             Ta bort rast
            </button>
           )}
          </div>
          {breakMinutes > 0 && (
           <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Rast: {breakMinutes} minuter kommer dras av från totala tiden
           </div>
          )}
         </div>
        </>
       ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-[8px]">
         <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
          {type === 'vabb' && 'VAB registreras automatiskt som 8 timmar per dag.'}
          {type === 'sick' && 'Sjukdom registreras automatiskt som 8 timmar per dag.'}
          {type === 'vacation' && 'Semester registreras automatiskt som 8 timmar per dag.'}
          {type === 'absence' && 'Frånvaro registreras automatiskt som 8 timmar per dag.'}
         </p>
        </div>
       )}
       
       {requiresTimeFields && (
        <>
         {/* Multi-project toggle */}
         <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-[8px] border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
           <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2">
            <input
             type="checkbox"
             checked={multiProjectMode}
             onChange={(e) => {
              setMultiProjectMode(e.target.checked)
              if (!e.target.checked) {
               // Återställ till single project mode
               setProjectEntries([{ projectId: '', hours: 0 }])
               setProject('')
              } else {
               // Initiera första entry med nuvarande projekt och timmar, eller tomt om inget projekt valt
               if (project && hours > 0) {
                setProjectEntries([{ projectId: project, hours: hours }])
               } else {
                setProjectEntries([{ projectId: '', hours: 0 }])
               }
               setProject('')
              }
             }}
             className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold">Jobbade du på flera projekt?</span>
           </label>
          </div>
         </div>
         
         {multiProjectMode ? (
          <div className="space-y-4">
           <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ange timmar för varje projekt:
           </div>
           {projectEntries.map((entry, index) => (
            <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 dark:bg-gray-900 rounded-[8px] border border-gray-200 dark:border-gray-700">
             <div className="flex-1">
              <CompanySelector
               value={entry.projectId}
               onChange={(value) => {
                const updated = [...projectEntries]
                updated[index].projectId = value
                setProjectEntries(updated)
               }}
               dynamicProjects={projects}
              />
             </div>
             <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
               Timmar
              </label>
              <input
               type="number"
               step="0.5"
               min="0"
               value={entry.hours}
               onChange={(e) => {
                const updated = [...projectEntries]
                const newHours = Math.max(0, parseFloat(e.target.value) || 0)
                updated[index].hours = newHours
                setProjectEntries(updated)
                // Uppdatera totala timmar baserat på summan
                const total = updated.reduce((sum, e) => sum + e.hours, 0)
                setHours(total)
               }}
               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
             </div>
             {projectEntries.length > 1 && (
              <button
               type="button"
               onClick={() => {
                const updated = projectEntries.filter((_, i) => i !== index)
                setProjectEntries(updated)
                // Uppdatera totala timmar efter borttagning
                const total = updated.reduce((sum, e) => sum + e.hours, 0)
                setHours(total)
               }}
               className="mt-6 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
               title="Ta bort projekt"
              >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
              </button>
             )}
            </div>
           ))}
           <button
            type="button"
            onClick={() => {
             setProjectEntries([...projectEntries, { projectId: '', hours: 0 }])
            }}
            className="w-full py-2 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
           >
            + Lägg till projekt
           </button>
           {totalMultiProjectHours > 0 && (
            <div className="text-sm p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
             Totalt: {totalMultiProjectHours.toFixed(1)}h fördelat på {projectEntries.filter(e => e.projectId && e.hours > 0).length} projekt
            </div>
           )}
          </div>
         ) : (
          <CompanySelector
           value={project}
           onChange={setProject}
           dynamicProjects={projects}
          />
         )}
        </>
       )}
       
       <EmployeeSelector
        value={employeeId}
        onChange={setEmployeeId}
        dynamicEmployees={employees}
        disabled={!isAdmin}
        lockedEmployeeId={!isAdmin ? currentEmployeeId : undefined}
       />
       
       <CommentBox value={notes} onChange={setNotes} />
       
       <div className="p-4 bg-primary-500 hover:bg-primary-600 dark:bg-blue-900/20 rounded-[8px] border border-blue-100 dark:border-blue-900/50">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
         {multiProjectMode ? 'Totalt timmar (fördelat på projekt)' : 'Totalt rapporterade timmar'}
        </div>
        <div className="text-3xl font-semibold text-gray-900 dark:text-white">
         {hours.toFixed(1)}h
        </div>
        {multiProjectMode && (
         <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Fördelat: {totalMultiProjectHours.toFixed(1)}h
         </div>
        )}
       </div>
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
       <button
        type="submit"
        disabled={saving}
        className="w-full sm:flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-3 sm:py-4 px-6 text-base sm:text-lg font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
       >
        {saving ? (
         <span className="flex items-center justify-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Sparar...
         </span>
        ) : (
         'Spara tidrapport'
        )}
       </button>
       <button
        type="button"
        onClick={() => router.back()}
        className="w-full sm:w-auto px-6 py-3 sm:py-4 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all text-sm sm:text-base"
       >
        Avbryt
       </button>
      </div>
     </form>
    </div>
   </main>
  </div>
  </ErrorBoundary>
 )
}
