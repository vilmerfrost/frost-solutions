'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import { invalidateDashboardData } from '@/lib/queryInvalidation'
import { calculateOBHours, calculateTotalAmount, OBTimeSplit } from '@/lib/obCalculation'
import { roundOBTimeSplit } from '@/lib/timeRounding'
import { checkTimeOverlap, formatDuplicateMessage } from '@/lib/duplicateCheck'
import { 
 getCurrentPosition, 
 findNearestWorkSite, 
 isWithinAutoCheckinDistance,
 startGPSTracking,
 stopGPSTracking,
 GPSLocation,
 WorkSite
} from '@/lib/gpsUtils'

interface TimeClockProps {
 employeeId: string | null
 projects: Array<{ id: string; name: string }>
 tenantId?: string | null
}

export default function TimeClock({ employeeId, projects, tenantId: propTenantId }: TimeClockProps) {
 const router = useRouter()
 const queryClient = useQueryClient()
 const { tenantId: contextTenantId } = useTenant()
 // Use prop tenantId if provided, otherwise fall back to context
 const tenantId = propTenantId || contextTenantId
 const [isCheckedIn, setIsCheckedIn] = useState(false)
 const [activeTimeEntry, setActiveTimeEntry] = useState<any>(null)
 const [selectedProject, setSelectedProject] = useState('')
 const [elapsedTime, setElapsedTime] = useState(0)
 const [isPaused, setIsPaused] = useState(false)
 const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null)
 const [totalPauseTime, setTotalPauseTime] = useState(0) // Total pause time in minutes
 const [loading, setLoading] = useState(false)
 const [elapsedInterval, setElapsedInterval] = useState<NodeJS.Timeout | null>(null)
 const [workSites, setWorkSites] = useState<WorkSite[]>([])
 const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null)
 const [gpsTrackingInterval, setGpsTrackingInterval] = useState<number | null>(null)
 const [gpsPermissionGranted, setGpsPermissionGranted] = useState<boolean | null>(null)
 const [nearestSite, setNearestSite] = useState<{ site: WorkSite; distance: number } | null>(null)
 const [gpsAutoCheckinEnabled, setGpsAutoCheckinEnabled] = useState<boolean>(false)
 const [eightHourReminderShown, setEightHourReminderShown] = useState<boolean>(false)
 const [isOnline, setIsOnline] = useState<boolean | null>(null)

 useEffect(() => {
  if (typeof window === 'undefined') {
   setIsOnline(true)
   return
  }
  setIsOnline(navigator.onLine)
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
   window.removeEventListener('online', handleOnline)
   window.removeEventListener('offline', handleOffline)
  }
 }, [])

 // Load GPS auto-checkin setting from localStorage on mount
 useEffect(() => {
  if (!employeeId || !tenantId) return
  
  const storageKey = `gpsAutoCheckin_${employeeId}_${tenantId}`
  const saved = localStorage.getItem(storageKey)
  if (saved !== null) {
   setGpsAutoCheckinEnabled(saved === 'true')
  } else {
   // Default: disabled (must be manually enabled)
   setGpsAutoCheckinEnabled(false)
   localStorage.setItem(storageKey, 'false')
  }
 }, [employeeId, tenantId])

 // Check for active time entry on mount and restore from localStorage
 useEffect(() => {
  async function checkActiveEntry() {
   // Don't log warnings during initial mount - wait for TenantContext to hydrate
   if (!tenantId || !employeeId) {
    return
   }

   // First check localStorage for cached state
   const storageKey = `timeClock_${employeeId}_${tenantId}`
   const cached = localStorage.getItem(storageKey)
   let restoredState: any = null
   
   if (cached) {
    try {
     const cachedData = JSON.parse(cached)
     if (cachedData.activeTimeEntry && cachedData.isCheckedIn) {
      // Validate that cached entry has start_time
      if (!cachedData.activeTimeEntry.start_time) {
       console.warn('⚠️ Cached time entry missing start_time, clearing cache')
       localStorage.removeItem(storageKey)
       return
      }
      
      restoredState = cachedData
      setIsCheckedIn(true)
      setActiveTimeEntry(cachedData.activeTimeEntry)
      setSelectedProject(cachedData.activeTimeEntry.project_id || '')
      setIsPaused(cachedData.isPaused || false)
      setTotalPauseTime(cachedData.totalPauseTime || 0)
      
      // Restore pause state if paused
      if (cachedData.isPaused && cachedData.pauseStartTime) {
       setPauseStartTime(new Date(cachedData.pauseStartTime))
      }
      
      // Start elapsed time calculation immediately
      if (cachedData.activeTimeEntry.start_time) {
       const start = new Date(`${cachedData.activeTimeEntry.date}T${cachedData.activeTimeEntry.start_time}`)
       const updateElapsed = () => {
        const now = new Date()
        let diff = (now.getTime() - start.getTime()) / 1000 / 60 // minutes
        
        // Subtract total pause time
        diff -= (cachedData.totalPauseTime || 0)
        
        // Subtract current pause if paused
        if (cachedData.isPaused && cachedData.pauseStartTime) {
         const pauseStart = new Date(cachedData.pauseStartTime)
         const currentPause = (now.getTime() - pauseStart.getTime()) / 1000 / 60
         diff -= currentPause
        }
        
        setElapsedTime(Math.max(0, Math.floor(diff)))
       }
       updateElapsed()
       // Use a more frequent interval for better accuracy
       const interval = setInterval(updateElapsed, 5000) // Update every 5 seconds
       setElapsedInterval(interval)
      }
     }
    } catch (err) {
     console.error('Error parsing cached time clock data:', err)
    }
   }

   // Then verify with database
   try {
    if (isOnline === false) {
     console.warn('📴 Offline - skipping active time entry server check')
    }

    let data: any = null
    if (isOnline !== false) {
     const response = await fetch(`/api/time-entries/active?employeeId=${employeeId}`, { cache: 'no-store' })
     if (response.ok) {
      const result = await response.json()
      data = result?.data ?? null
     } else {
      console.error('Error fetching active time entry via API:', await response.text())
     }
    }

    if (data) {
     // Validate that start_time exists - if not, skip this entry
     if (!data.start_time) {
      console.warn('⚠️ Active time entry found but missing start_time:', data.id)
      // Clear this invalid entry from state
      const storageKey = `timeClock_${employeeId}_${tenantId}`
      localStorage.removeItem(storageKey)
      setIsCheckedIn(false)
      setActiveTimeEntry(null)
      setIsPaused(false)
      setPauseStartTime(null)
      setTotalPauseTime(0)
      setElapsedTime(0)
      if (elapsedInterval) {
       clearInterval(elapsedInterval)
       setElapsedInterval(null)
      }
      toast.error('Aktiv stämpling saknar starttid. Kontakta administratören.')
      return
     }
     
     // Update state if different from cached
     if (!restoredState || restoredState.activeTimeEntry.id !== data.id) {
      setIsCheckedIn(true)
      setActiveTimeEntry(data)
      setSelectedProject(data.project_id || '')
     }
     
     // Save to localStorage with current state
     const storageKey = `timeClock_${employeeId}_${tenantId}`
     localStorage.setItem(storageKey, JSON.stringify({
      activeTimeEntry: data,
      isCheckedIn: true,
      isPaused: isPaused,
      totalPauseTime: totalPauseTime,
      pauseStartTime: pauseStartTime?.toISOString() || null
     }))
     
     // Setup elapsed time calculation if not already done
     if (!elapsedInterval && data.start_time) {
      const start = new Date(`${data.date}T${data.start_time}`)
      const updateElapsed = () => {
       if (isPaused) {
        // Don't update elapsed time while paused
        return
       }
       
       const now = new Date()
       let diff = (now.getTime() - start.getTime()) / 1000 / 60 // minutes
       
       // Subtract total pause time
       diff -= totalPauseTime
       
       // Subtract current pause if paused
       if (pauseStartTime) {
        const currentPause = (now.getTime() - pauseStartTime.getTime()) / 1000 / 60
        diff -= currentPause
       }
       
       setElapsedTime(Math.max(0, Math.floor(diff)))
      }
      updateElapsed()
      const interval = setInterval(updateElapsed, 5000) // Update every 5 seconds
      setElapsedInterval(interval)
     }
    } else {
     // No active entry in DB, clear localStorage and state
     const storageKey = `timeClock_${employeeId}_${tenantId}`
     localStorage.removeItem(storageKey)
     setIsCheckedIn(false)
     setActiveTimeEntry(null)
     setIsPaused(false)
     setPauseStartTime(null)
     setTotalPauseTime(0)
     setElapsedTime(0)
     if (elapsedInterval) {
      clearInterval(elapsedInterval)
      setElapsedInterval(null)
     }
    }
   } catch (err) {
    console.error('Error checking active entry:', err)
   }
  }

  checkActiveEntry()
  
  // Cleanup interval on unmount
  return () => {
   if (elapsedInterval) {
    clearInterval(elapsedInterval)
   }
  }
 }, [tenantId, employeeId, isOnline])
 
 // Update elapsed time when pause state changes (separate effect to avoid race conditions)
 useEffect(() => {
  if (!activeTimeEntry || !activeTimeEntry.start_time || !isCheckedIn) {
   if (elapsedInterval) {
    clearInterval(elapsedInterval)
    setElapsedInterval(null)
   }
   return
  }
  
  const start = new Date(`${activeTimeEntry.date}T${activeTimeEntry.start_time}`)
  const updateElapsed = () => {
   if (isPaused) {
    // Keep current elapsed time when paused, don't update
    return
   }
   
   const now = new Date()
   let diff = (now.getTime() - start.getTime()) / 1000 / 60
   diff -= totalPauseTime
   
   if (pauseStartTime) {
    const currentPause = (now.getTime() - pauseStartTime.getTime()) / 1000 / 60
    diff -= currentPause
   }
   
   setElapsedTime(Math.max(0, Math.floor(diff)))
  }
  
  // Clear old interval
  if (elapsedInterval) {
   clearInterval(elapsedInterval)
  }
  
  updateElapsed()
  const interval = setInterval(updateElapsed, 5000)
  setElapsedInterval(interval)
  
  return () => {
   clearInterval(interval)
  }
 }, [activeTimeEntry?.id, activeTimeEntry?.date, activeTimeEntry?.start_time, isPaused, pauseStartTime, totalPauseTime, isCheckedIn])
 
 // Save state to localStorage whenever it changes
 useEffect(() => {
  if (!tenantId || !employeeId) return
  
  const storageKey = `timeClock_${employeeId}_${tenantId}`
  if (isCheckedIn && activeTimeEntry) {
   localStorage.setItem(storageKey, JSON.stringify({
    activeTimeEntry,
    isCheckedIn,
    isPaused,
    totalPauseTime,
    pauseStartTime: pauseStartTime?.toISOString() || null
   }))
  } else {
   localStorage.removeItem(storageKey)
  }
 }, [tenantId, employeeId, isCheckedIn, activeTimeEntry, isPaused, totalPauseTime, pauseStartTime])

 // Fetch work sites
 useEffect(() => {
  async function fetchWorkSites() {
   if (!tenantId || isOnline === false) return

   try {
    const { data, error } = await supabase
     .from('work_sites')
     .select('id, name, latitude, longitude, radius_meters, auto_checkin_enabled, auto_checkin_distance')
     .eq('tenant_id', tenantId)

    if (error) {
     console.error('Error fetching work sites:', error)
     // Don't show error if table doesn't exist yet
     if (!error.message.includes('does not exist')) {
      console.warn('Work sites table may not exist yet. Run SUPABASE_CREATE_WORK_SITES.sql')
     }
    } else if (data) {
     setWorkSites(data.map(site => ({
      id: site.id,
      name: site.name,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      radius_meters: site.radius_meters || 100,
      auto_checkin_enabled: site.auto_checkin_enabled || false,
      auto_checkin_distance: site.auto_checkin_distance || 500,
     })))
    }
   } catch (err) {
    console.error('Error in fetchWorkSites:', err)
   }
  }

  fetchWorkSites()
 }, [tenantId, isOnline])

 // GPS tracking and auto-checkin - ONLY if manually enabled
 useEffect(() => {
  // CRITICAL: GPS auto-checkin is disabled by default and must be manually enabled
  if (!gpsAutoCheckinEnabled) {
   // Stop tracking if disabled
   if (gpsTrackingInterval !== null) {
    stopGPSTracking(gpsTrackingInterval)
    setGpsTrackingInterval(null)
   }
   return
  }

  if (isOnline === false || isOnline === null || !employeeId || !tenantId || isCheckedIn || workSites.length === 0) {
   // Stop tracking if checked in or no work sites
   if (gpsTrackingInterval !== null) {
    stopGPSTracking(gpsTrackingInterval)
    setGpsTrackingInterval(null)
   }
   return
  }

  // Check if any work site has auto-checkin enabled
  const hasAutoCheckin = workSites.some(site => site.auto_checkin_enabled)
  if (!hasAutoCheckin) return

  // Request GPS permission and start tracking
  async function initGPSTracking() {
   try {
    const location = await getCurrentPosition()
    setCurrentLocation(location)
    setGpsPermissionGranted(true)

    // Find nearest work site
    const nearest = findNearestWorkSite(location, workSites)
    setNearestSite(nearest)

    // Check if within auto-checkin distance
    if (nearest && isWithinAutoCheckinDistance(location, nearest.site)) {
     // Auto-checkin reminder - DO NOT auto-checkin, only show notification
     if (projects.length > 0 && !isCheckedIn) {
      toast.info(`📍 Du är nära ${nearest.site.name} - Kom ihåg att stämpla in!`, { duration: 5000 })
      // NOTE: GPS auto-checkin does NOT automatically check in - user must click manually
     }
    }

    // Start continuous tracking (every 2 minutes for auto-checkin check)
    const intervalId = startGPSTracking((newLocation) => {
     setCurrentLocation(newLocation)
     
     const updatedNearest = findNearestWorkSite(newLocation, workSites)
     setNearestSite(updatedNearest)

     // Check auto-checkin on each update
     if (updatedNearest && isWithinAutoCheckinDistance(newLocation, updatedNearest.site)) {
      // Show reminder if not checked in
      if (!isCheckedIn && projects.length > 0) {
       toast.info(`📍 Du är nära ${updatedNearest.site.name} - Kom ihåg att stämpla in!`, { duration: 5000 })
      }
     }
    }, 2 * 60 * 1000) // Check every 2 minutes

    setGpsTrackingInterval(intervalId)
   } catch (error: any) {
    console.error('GPS permission denied or error:', error)
    setGpsPermissionGranted(false)
    if (error.code === 1) {
     toast.warning('GPS-tillstånd nekat. Auto-checkin fungerar inte.')
    }
   }
  }

  initGPSTracking()

  // Cleanup
  return () => {
   if (gpsTrackingInterval !== null) {
    stopGPSTracking(gpsTrackingInterval)
    setGpsTrackingInterval(null)
   }
  }
 }, [employeeId, tenantId, isCheckedIn, workSites, projects.length, gpsAutoCheckinEnabled, isOnline])

 // Cleanup GPS tracking when component unmounts or when checked in
 useEffect(() => {
  if (isCheckedIn && gpsTrackingInterval !== null) {
   stopGPSTracking(gpsTrackingInterval)
   setGpsTrackingInterval(null)
  }
 }, [isCheckedIn, gpsTrackingInterval])

 // 8-hour reminder notification
 useEffect(() => {
  if (isOnline === false || !isCheckedIn || !activeTimeEntry || eightHourReminderShown || isPaused) return

  const checkEightHours = () => {
   if (!activeTimeEntry.start_time || !activeTimeEntry.date) return

   const start = new Date(`${activeTimeEntry.date}T${activeTimeEntry.start_time}`)
   const now = new Date()
   const diffMinutes = (now.getTime() - start.getTime()) / 1000 / 60
   
   // Subtract pause time
   const actualWorkMinutes = diffMinutes - totalPauseTime
   
   // 8 hours = 480 minutes
   if (actualWorkMinutes >= 480 && !eightHourReminderShown) {
    toast.warning(
     '⏰ Du har jobbat i 8 timmar! Jobbar du fortfarande? Glöm inte att signa ut!',
     { duration: 10000 }
    )
    setEightHourReminderShown(true)
   }
  }

  // Check every minute
  const interval = setInterval(checkEightHours, 60000)
  checkEightHours() // Check immediately

  return () => clearInterval(interval)
 }, [isOnline, isCheckedIn, activeTimeEntry, eightHourReminderShown, isPaused, totalPauseTime])

 // Reset 8-hour reminder when checking out
 useEffect(() => {
  if (!isCheckedIn) {
   setEightHourReminderShown(false)
  }
 }, [isCheckedIn])

 async function handleCheckIn() {
  if (!tenantId || !employeeId) {
   toast.error('Anställd måste väljas!')
   return
  }

  if (!selectedProject) {
   toast.error('Välj ett projekt först!')
   return
  }

  if (isOnline === false) {
   toast.error('Ingen internetanslutning. Försök igen när du är online.')
   return
  }

  setLoading(true)
  try {
   const now = new Date()
   const date = now.toISOString().split('T')[0]
   const time = now.toTimeString().slice(0, 5) // HH:MM

   const { data: userData } = await supabase.auth.getUser()
   const userId = userData?.user?.id

   if (!userId) {
    toast.error('Du är inte inloggad.')
    setLoading(false)
    return
   }

   // Get employee base rate
   const { data: empData } = await supabase
    .from('employees')
    .select('base_rate_sek, default_rate_sek')
    .eq('id', employeeId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

   const baseRate = Number(empData?.base_rate_sek || empData?.default_rate_sek || 360)

   // Get GPS location and work site
   let startLocation: GPSLocation | null = null
   let workSiteId: string | null = null

   try {
    if (currentLocation) {
     startLocation = currentLocation
    } else {
     startLocation = await getCurrentPosition()
    }
    if (startLocation && workSites.length > 0) {
     const nearest = findNearestWorkSite(startLocation, workSites)
     if (nearest && nearest.distance <= nearest.site.radius_meters) {
      workSiteId = nearest.site.id
     }
    }
   } catch (error) {
    console.warn('Could not get GPS location for check-in:', error)
    // Continue without GPS - not critical
   }

   // Build payload with GPS data
   const payload: any = {
    tenant_id: tenantId,
    employee_id: employeeId,
    user_id: userId,
    project_id: selectedProject,
    date,
    start_time: time,
    end_time: null,
    hours_total: 0,
    ob_type: 'work', // Default, will be recalculated on checkout
    amount_total: 0,
   }

   // Add GPS data if available
   if (startLocation) {
    payload.start_location_lat = startLocation.latitude
    payload.start_location_lng = startLocation.longitude
   }
   if (workSiteId) {
    payload.work_site_id = workSiteId
   }

   // Add remaining fields
   payload.is_billed = false
   payload.break_minutes = 0

   // 🔍 DUBBLETT-KONTROLL: Kontrollera om det redan finns en aktiv stämpling eller överlappning
   let existingEntries: any[] = []
   try {
    const duplicateResponse = await fetch(`/api/time-entries/list?date=${date}`, {
     cache: 'no-store',
    })
    if (duplicateResponse.ok) {
     const duplicatePayload = await duplicateResponse.json()
     existingEntries = (duplicatePayload.entries || []).filter(
      (entry: any) => entry.employee_id === employeeId,
     )
    } else {
     console.warn('❌ Failed to fetch existing entries for duplication check:', await duplicateResponse.text())
    }
   } catch (duplicateErr) {
    console.warn('⚠️ Duplication check failed:', duplicateErr)
   }

   const activeEntry = existingEntries.find((entry) => !entry.end_time)
   if (activeEntry) {
    toast.error('Du har redan en aktiv stämpling för detta datum. Stämpla ut först innan du stämplar in igen.')
    setLoading(false)
    return
   }

   const isDuplicate = checkTimeOverlap(
    {
     employee_id: employeeId,
     project_id: selectedProject,
     date,
     start_time: time,
     end_time: null,
     tenant_id: tenantId,
    },
    existingEntries,
   )

   if (isDuplicate) {
    const confirmed = window.confirm(
     `⚠️ Det finns redan en tidsrapport som överlappar med denna tid.\n\nVill du ändå stämpla in?`,
    )

    if (!confirmed) {
     setLoading(false)
     return
    }
   }

   // Create time entry via API route to ensure tenant_id is valid
   const response = await fetch('/api/time-entries/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
   })

   const result = await response.json()

   if (!response.ok || result.error) {
    console.error('Error checking in - Full response:', JSON.stringify(result, null, 2))
    
    // Show detailed error message
    let errorMsg = result.error || 'Okänt fel'
    
    if (result.diagnosticInfo) {
     const diag = result.diagnosticInfo
     errorMsg = `Foreign key error: Tenant ${diag.tenantId} ${diag.tenantVerified ? 'finns' : 'finns INTE'} i databasen.`
     if (diag.availableTenants && diag.availableTenants.length > 0) {
      errorMsg += ` Tillgängliga tenants: ${diag.availableTenants.map((t: any) => t.id).join(', ')}`
     }
     if (diag.suggestion) {
      errorMsg += `\n${diag.suggestion}`
     }
    } else if (result.suggestion) {
     errorMsg += `\n${result.suggestion}`
    }
    
    toast.error('Kunde inte stämpla in: ' + errorMsg)
   } else {
    setIsCheckedIn(true)
    setActiveTimeEntry(result.data)
    setSelectedProject(result.data.project_id || '')
    setEightHourReminderShown(false) // Reset 8-hour reminder on new check-in
    toast.success('Stämplat in! Kom ihåg att stämpla ut när du är klar.')
    
    // Invalidera dashboard queries för att synka data
    await invalidateDashboardData('clock-in')
    
    // Dispatch event för andra komponenter
    if (typeof window !== 'undefined') {
     window.dispatchEvent(new CustomEvent('timeEntryUpdated', {
      detail: { action: 'clock-in', entryId: result.data?.id }
     }))
    }
   }
  } catch (err: any) {
   console.error('Unexpected error:', err)
   toast.error('Ett oväntat fel uppstod: ' + err.message)
  } finally {
   setLoading(false)
  }
 }

 async function handleCheckOut() {
  if (!tenantId || !employeeId || !activeTimeEntry) {
   toast.error('Ingen aktiv stämpling hittades.')
   return
  }

  setLoading(true)
  try {
   if (isOnline === false) {
    toast.error('Ingen internetanslutning. Försök igen när du är online.')
    setLoading(false)
    return
   }
   const now = new Date()
   const endTime = now.toTimeString().slice(0, 5) // HH:MM
   let startTime = activeTimeEntry.start_time
   let date = activeTimeEntry.date instanceof Date 
    ? activeTimeEntry.date 
    : new Date(activeTimeEntry.date) // Handle both Date and string
   
   // If start_time is missing, try to fetch it from database
   if (!startTime && activeTimeEntry.id) {
    console.warn('⚠️ start_time missing in state, fetching from API...')
    try {
     const detailResponse = await fetch(`/api/time-entries/get?id=${activeTimeEntry.id}`, {
      cache: 'no-store',
     })
     if (!detailResponse.ok) {
      const errorText = await detailResponse.text()
      console.error('Failed to fetch entry details:', errorText)
      toast.error('Kunde inte hämta stämplingsdata från servern.')
      setLoading(false)
      return
     }

     const detailPayload = await detailResponse.json()
     const freshEntry = detailPayload.entry

     if (!freshEntry?.start_time) {
      toast.error('Starttid saknas i databasen. Kan inte stämpla ut. Kontakta administratören.')
      setLoading(false)
      return
     }

     startTime = freshEntry.start_time
     date = freshEntry.date ? new Date(freshEntry.date) : date

     setActiveTimeEntry((prev: any) => ({
      ...prev,
      start_time: startTime,
      date,
     }))
    } catch (detailErr) {
     console.error('Error fetching entry details:', detailErr)
     toast.error('Kunde inte hämta stämplingsdata från servern.')
     setLoading(false)
     return
    }
   }
   
   // Validate that start_time exists
   if (!startTime) {
    toast.error('Starttid saknas. Kan inte stämpla ut.')
    setLoading(false)
    return
   }
   
   // Validate date
   if (isNaN(date.getTime())) {
    toast.error('Ogiltigt datum. Kan inte stämpla ut.')
    setLoading(false)
    return
   }
   
   // If currently paused, resume first to calculate pause time
   let finalTotalPauseTime = totalPauseTime
   if (isPaused && pauseStartTime) {
    const currentPauseDuration = (now.getTime() - pauseStartTime.getTime()) / 1000 / 60
    finalTotalPauseTime = totalPauseTime + currentPauseDuration
   }

   // Get employee base rate
   const { data: empData } = await supabase
    .from('employees')
    .select('base_rate_sek, default_rate_sek')
    .eq('id', employeeId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

   const baseRate = Number(empData?.base_rate_sek || empData?.default_rate_sek || 360)

   // Calculate OB hours for this work period
   // Note: OB is calculated based on actual clock times, but we'll adjust hours_total to reflect actual work time minus pauses
   const obSplit = calculateOBHours(startTime, endTime, date)
   
   // Adjust total hours to subtract pause time
   // OB times are based on clock times, but billed hours should exclude pause time
   const pauseTimeHours = finalTotalPauseTime / 60
   if (pauseTimeHours > 0 && obSplit.total > pauseTimeHours) {
    obSplit.total = Math.max(0, obSplit.total - pauseTimeHours)
    // Proportionally reduce OB hours if needed
    const reductionRatio = obSplit.total / (obSplit.total + pauseTimeHours)
    if (reductionRatio < 1) {
     obSplit.regular = Math.max(0, obSplit.regular * reductionRatio)
     obSplit.evening = Math.max(0, obSplit.evening * reductionRatio)
     obSplit.night = Math.max(0, obSplit.night * reductionRatio)
     obSplit.weekend = Math.max(0, obSplit.weekend * reductionRatio)
     // Recalculate total to ensure consistency
     obSplit.total = obSplit.regular + obSplit.evening + obSplit.night + obSplit.weekend
    }
   }
   
   // Om total är 0 eller mycket liten, säkerställ minst 0,5 timmar
   // Detta säkerställer att time entry alltid sparas och syns i rapporter
   if (obSplit.total <= 0 || obSplit.total < 0.01) {
    // Beräkna faktisk tid i minuter - validera att tider finns
    if (startTime && endTime) {
     const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
     const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])
     let actualMinutes = endMinutes - startMinutes
     if (actualMinutes < 0) actualMinutes += 24 * 60 // Hantera över midnatt
     
     // Om det finns faktisk tid (även om den är kort), säkerställ minst 0,5 timmar
     if (actualMinutes > 0) {
      obSplit.total = 0.5
      // Fördela på rätt OB-typ baserat på tid
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const hour = parseInt(startTime.split(':')[0])
      
      if (isWeekend) {
       obSplit.weekend = 0.5
       obSplit.regular = 0
       obSplit.evening = 0
       obSplit.night = 0
      } else if (hour >= 22 || hour < 6) {
       obSplit.night = 0.5
       obSplit.regular = 0
       obSplit.evening = 0
       obSplit.weekend = 0
      } else if (hour >= 18) {
       obSplit.evening = 0.5
       obSplit.regular = 0
       obSplit.night = 0
       obSplit.weekend = 0
      } else {
       obSplit.regular = 0.5
       obSplit.evening = 0
       obSplit.night = 0
       obSplit.weekend = 0
      }
     }
    }
   }
   
   // Avrunda till minst 0,5 timmar
   const roundedSplit = roundOBTimeSplit(obSplit)
   
   // CRITICAL: Säkerställ att total alltid är minst 0.5 om det finns en faktisk tid
   // Detta är en extra säkerhetsåtgärd eftersom avrundning kan ge 0 om tiden är mycket kort
   if (roundedSplit.total <= 0 && startTime && endTime) {
    console.warn('⚠️ TimeClock: roundedSplit.total is 0, forcing to 0.5 hours', { startTime, endTime, obSplit, roundedSplit })
    roundedSplit.total = 0.5
    // Uppdatera också rätt OB-typ
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const hour = parseInt(startTime.split(':')[0])
    
    if (isWeekend) {
     roundedSplit.weekend = 0.5
     roundedSplit.regular = 0
     roundedSplit.evening = 0
     roundedSplit.night = 0
    } else if (hour >= 22 || hour < 6) {
     roundedSplit.night = 0.5
     roundedSplit.regular = 0
     roundedSplit.evening = 0
     roundedSplit.weekend = 0
    } else if (hour >= 18) {
     roundedSplit.evening = 0.5
     roundedSplit.regular = 0
     roundedSplit.night = 0
     roundedSplit.weekend = 0
    } else {
     roundedSplit.regular = 0.5
     roundedSplit.evening = 0
     roundedSplit.night = 0
     roundedSplit.weekend = 0
    }
   }
   
   const totalAmount = calculateTotalAmount(roundedSplit, baseRate)
   
   console.log('🔍 TimeClock checkout calculation:', {
    startTime,
    endTime,
    obSplit: { ...obSplit },
    roundedSplit: { ...roundedSplit },
    totalAmount
   })

   // Get GPS location for checkout
   let endLocation: GPSLocation | null = null
   try {
    if (currentLocation) {
     endLocation = currentLocation
    } else {
     endLocation = await getCurrentPosition()
    }
   } catch (error) {
    console.warn('Could not get GPS location for check-out:', error)
   }

   // Determine primary OB type (the one with most hours)
   let primaryOBType = 'work'
   if (obSplit.weekend > 0) {
    primaryOBType = 'weekend'
   } else if (obSplit.night > 0 && obSplit.night >= obSplit.evening) {
    primaryOBType = 'night'
   } else if (obSplit.evening > 0) {
    primaryOBType = 'evening'
   }

   // Build update payload with GPS data
   const updatePayload: any = {
    tenant_id: tenantId, // Include tenant_id to ensure correct tenant
    end_time: endTime,
    hours_total: roundedSplit.total, // Use rounded hours
    ob_type: primaryOBType,
    amount_total: Math.round(totalAmount * 100) / 100,
   }

   // Add GPS data if available
   if (endLocation) {
    updatePayload.end_location_lat = endLocation.latitude
    updatePayload.end_location_lng = endLocation.longitude
   }

   // Update the time entry via API route to ensure tenant_id is valid
   const updateResponse = await fetch(`/api/time-entries/${activeTimeEntry.id}/update`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload),
   })

   const updateResult = await updateResponse.json()
   const updateError = updateResponse.ok ? null : updateResult

   if (updateError) {
    console.error('Error checking out:', updateError)
    toast.error('Kunde inte stämpla ut: ' + updateError.message)
   } else {
    // If work spans multiple OB types, create separate entries for clarity
    // (or we can keep it as one entry with the primary type)
    // For now, we'll create multiple entries if there are multiple OB types
    
    if ((obSplit.regular > 0 && (obSplit.evening > 0 || obSplit.night > 0)) || 
      (obSplit.evening > 0 && obSplit.night > 0)) {
     // Work spans multiple OB periods - create separate entries
     const entriesToCreate = []
     
     if (obSplit.regular > 0) {
      entriesToCreate.push({
       tenant_id: tenantId,
       employee_id: employeeId,
       user_id: (await supabase.auth.getUser()).data?.user?.id,
       project_id: activeTimeEntry.project_id,
       date: activeTimeEntry.date,
       start_time: startTime,
       end_time: '18:00',
       hours_total: obSplit.regular,
       ob_type: 'work',
       amount_total: obSplit.regular * baseRate * 1.0,
       is_billed: false,
       break_minutes: 0,
      })
     }
     
     if (obSplit.evening > 0) {
      entriesToCreate.push({
       tenant_id: tenantId,
       employee_id: employeeId,
       user_id: (await supabase.auth.getUser()).data?.user?.id,
       project_id: activeTimeEntry.project_id,
       date: activeTimeEntry.date,
       start_time: '18:00',
       end_time: obSplit.night > 0 ? '22:00' : endTime,
       hours_total: obSplit.evening,
       ob_type: 'evening',
       amount_total: obSplit.evening * baseRate * 1.5,
       is_billed: false,
       break_minutes: 0,
      })
     }
     
     if (obSplit.night > 0) {
      entriesToCreate.push({
       tenant_id: tenantId,
       employee_id: employeeId,
       user_id: (await supabase.auth.getUser()).data?.user?.id,
       project_id: activeTimeEntry.project_id,
       date: activeTimeEntry.date,
       start_time: '22:00',
       end_time: endTime,
       hours_total: obSplit.night,
       ob_type: 'night',
       amount_total: obSplit.night * baseRate * 1.5,
       is_billed: false,
       break_minutes: 0,
      })
     }

     // Delete the original entry and create separate ones
     const deleteResponse = await fetch(`/api/time-entries/delete?id=${activeTimeEntry.id}`, {
      method: 'DELETE',
     })

     if (!deleteResponse.ok) {
      console.error('Error deleting original entry:', await deleteResponse.text())
      toast.error('Kunde inte uppdatera stämpling. Försök igen eller kontakta administratören.')
      setLoading(false)
      return
     }

     // Create multiple entries via API route
     const createPromises = entriesToCreate.map(entry => 
      fetch('/api/time-entries/create', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(entry),
      })
     )
     
     const createResults = await Promise.all(createPromises)
     const failedResults = createResults.filter(r => !r.ok)
     const multiError = failedResults.length > 0 ? { message: 'Some entries failed to create' } : null

     if (multiError) {
      console.error('Error creating multi-OB entries:', multiError)
      // Fallback: keep the single entry
      toast.success(`Stämplat ut! ${obSplit.total.toFixed(1)}h registrerat.`)
     } else {
      const parts = []
      if (obSplit.regular > 0) parts.push(`${obSplit.regular.toFixed(1)}h vanlig`)
      if (obSplit.evening > 0) parts.push(`${obSplit.evening.toFixed(1)}h kväll`)
      if (obSplit.night > 0) parts.push(`${obSplit.night.toFixed(1)}h natt`)
      if (obSplit.weekend > 0) parts.push(`${obSplit.weekend.toFixed(1)}h helg`)
      toast.success(`Stämplat ut! ${obSplit.total.toFixed(1)}h registrerat (${parts.join(', ')})`)
     }
    } else {
     toast.success(`Stämplat ut! ${obSplit.total.toFixed(1)}h registrerat.`)
    }

    // Invalidera dashboard queries för att synka data
    await invalidateDashboardData('clock-out')
    
    // Dispatch event för andra komponenter
    if (typeof window !== 'undefined') {
     window.dispatchEvent(new CustomEvent('timeEntryUpdated', {
      detail: { action: 'clock-out', entryId: activeTimeEntry.id }
     }))
    }

    setIsCheckedIn(false)
    setActiveTimeEntry(null)
    setElapsedTime(0)
    setIsPaused(false)
    setPauseStartTime(null)
    setTotalPauseTime(0)
    
    // Clear interval
    if (elapsedInterval) {
     clearInterval(elapsedInterval)
     setElapsedInterval(null)
    }
    
    // Clear localStorage
    if (tenantId && employeeId) {
     const storageKey = `timeClock_${employeeId}_${tenantId}`
     localStorage.removeItem(storageKey)
    }
    
    // Trigger refresh of reports and project pages
    // Dispatch event immediately
    if (typeof window !== 'undefined') {
     // Dispatch event with detail for debugging
     const event = new CustomEvent('timeEntryUpdated', { 
      detail: { 
       timestamp: Date.now(),
       entryId: activeTimeEntry.id,
       projectId: activeTimeEntry.project_id, // Include project ID for targeted updates
       hours: roundedSplit.total,
       tenantId: tenantId // Include tenant ID for verification
      },
      bubbles: true, // Ensure event bubbles
      cancelable: true
     })
     
     // Log before dispatch
     console.log('📤 TimeClock: About to dispatch timeEntryUpdated event', event.detail)
     
     // Dispatch on window
     window.dispatchEvent(event)
     console.log('✅ TimeClock: Dispatched on window')
     
     // Also dispatch on document for maximum compatibility
     document.dispatchEvent(event)
     console.log('✅ TimeClock: Dispatched on document')
     
     // Also dispatch on document.body
     document.body?.dispatchEvent(event)
     console.log('✅ TimeClock: Dispatched on body')
     
     // Force a manual refresh call to all pages via localStorage
     localStorage.setItem('timeEntryUpdated', JSON.stringify({
      timestamp: Date.now(),
      entryId: activeTimeEntry.id,
      projectId: activeTimeEntry.project_id,
      hours: roundedSplit.total
     }))
     
     // Also refresh router for server components
     router.refresh()
    }
   }
  } catch (err: any) {
   console.error('Unexpected error:', err)
   toast.error('Ett oväntat fel uppstod: ' + err.message)
  } finally {
   setLoading(false)
  }
 }

 function handlePause() {
  if (!isCheckedIn || isPaused) return
  
  setIsPaused(true)
  setPauseStartTime(new Date())
  toast.info('⏸️ Stämpling pausad')
 }
 
 function handleResume() {
  if (!isCheckedIn || !isPaused || !pauseStartTime) return
  
  const now = new Date()
  const pauseDuration = (now.getTime() - pauseStartTime.getTime()) / 1000 / 60 // minutes
  setTotalPauseTime(prev => prev + pauseDuration)
  setIsPaused(false)
  setPauseStartTime(null)
  toast.success('▶️ Stämpling återupptagen')
 }
 
 const formatElapsedTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${String(mins).padStart(2, '0')}`
 }

 // Debug logging
 useEffect(() => {
  console.log('🔍 TimeClock: Component mounted/updated', {
   employeeId,
   projectsCount: projects.length,
   isCheckedIn,
   activeTimeEntry: !!activeTimeEntry,
   componentVisible: true,
  })
 }, [employeeId, projects.length, isCheckedIn, activeTimeEntry])

 // Always show TimeClock component
 return (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8" style={{ display: 'block', visibility: 'visible' }}>
   <div className="flex justify-between items-center mb-4 sm:mb-6">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
     ⏰ Stämpelklocka
    </h2>
    {/* GPS Status */}
    <div className="flex items-center gap-2">
     {/* GPS Auto-Checkin Toggle - Always visible when not checked in */}
     {!isCheckedIn && (
      <button
       onClick={() => {
        const newValue = !gpsAutoCheckinEnabled
        setGpsAutoCheckinEnabled(newValue)
        const storageKey = `gpsAutoCheckin_${employeeId}_${tenantId}`
        localStorage.setItem(storageKey, String(newValue))
        toast.info(newValue ? '📍 GPS auto-checkin aktiverad' : '📍 GPS auto-checkin inaktiverad')
       }}
       className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        gpsAutoCheckinEnabled
         ? 'bg-green-500 text-white hover:bg-green-600'
         : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
       }`}
       title={gpsAutoCheckinEnabled ? 'Klicka för att stänga av GPS auto-checkin' : 'Klicka för att aktivera GPS auto-checkin'}
      >
       {gpsAutoCheckinEnabled ? '📍 Auto ON' : '📍 Auto OFF'}
      </button>
     )}
     {gpsPermissionGranted === true && (
      <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
       <span>📍</span>
       <span className="hidden sm:inline">GPS aktiv</span>
      </div>
     )}
     {gpsPermissionGranted === false && (
      <div className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
       <span>📍</span>
       <span className="hidden sm:inline">GPS nekat</span>
      </div>
     )}
     {nearestSite && (
      <div className="text-xs text-gray-500 dark:text-gray-400">
       {Math.round(nearestSite.distance)}m från {nearestSite.site.name}
      </div>
     )}
    </div>
   </div>

   {isOnline === false && (
    <div className="mb-4 rounded-[8px] border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
     Du är offline. Visar senast sparade tidsdata – stämpla in/ut när du är online igen.
    </div>
   )}

   {/* Show appropriate message based on state */}
   {!employeeId ? (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-[8px] p-4 sm:p-6 border border-yellow-200 dark:border-yellow-800">
     <p className="text-gray-600 dark:text-gray-400 mb-4 font-semibold">
      ⚠️ Du behöver vara registrerad som anställd för att använda stämpelklockan.
     </p>
     <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      <p><strong>Snabb-fix:</strong></p>
      <button
       onClick={async () => {
        if (confirm('Detta kommer att försöka skapa en employee-record för dig. Fortsätt?')) {
         try {
          const res = await fetch('/api/admin/fix-role', { method: 'POST' })
          const data = await res.json()
          if (res.ok) {
           alert('✅ Employee-record skapad/uppdaterad! Ladda om sidan.')
           window.location.reload()
          } else {
           alert('❌ Fel: ' + data.error)
          }
         } catch (err: any) {
          alert('❌ Fel: ' + err.message)
         }
        }
       }}
       className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
      >
       🔧 Fixa min employee-record automatiskt
      </button>
      <div className="mt-3 space-y-1">
       <p className="font-semibold">Alternativ:</p>
       <ul className="list-disc list-inside space-y-1 ml-2">
        <li>Kontakta administratören för att bli tillagd som anställd</li>
        <li>Eller gå till <button onClick={() => router.push('/admin/debug')} className="text-blue-600 dark:text-blue-400 underline">Admin Debug</button> för mer info</li>
       </ul>
      </div>
     </div>
    </div>
   ) : projects.length === 0 ? (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-[8px] p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
     <p className="text-gray-600 dark:text-gray-400 mb-4">
      Skapa ett projekt först för att använda stämpelklockan.
     </p>
     <button
      onClick={() => router.push('/projects/new')}
      className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
     >
      Skapa projekt
     </button>
    </div>
   ) : !isCheckedIn ? (
    <div className="space-y-4">
     <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
       Projekt *
      </label>
      <select
       value={selectedProject}
       onChange={(e) => setSelectedProject(e.target.value)}
       className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
       required
      >
       <option value="">Välj projekt</option>
       {projects.map((proj) => (
        <option key={proj.id} value={proj.id}>
         {proj.name}
        </option>
       ))}
      </select>
     </div>

     <button
      onClick={handleCheckIn}
      disabled={loading || !selectedProject}
      className="w-full bg-success-500 hover:bg-success-600 text-white py-4 px-6 rounded-[8px] font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
     >
      {loading ? 'Stämplar in...' : '✅ Stämpla in'}
     </button>

     <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
      OB-beräkning sker automatiskt baserat på faktiska arbetstider enligt byggkollektivavtalet
     </p>
    </div>
   ) : (
    <div className="space-y-4">
     <div className="bg-blue-50 dark:bg-blue-900/20 rounded-[8px] p-6 border border-blue-200 dark:border-blue-800">
      <div className="text-center">
       <div className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
        {formatElapsedTime(elapsedTime)}
        {isPaused && <span className="text-lg text-yellow-600 dark:text-yellow-400 ml-2">⏸️</span>}
       </div>
       <p className="text-sm text-gray-600 dark:text-gray-400">
        {isPaused ? '⏸️ Pausad' : `Incheckad sedan ${activeTimeEntry?.start_time}`}
       </p>
       {activeTimeEntry?.project_id && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
         Projekt: {projects.find(p => p.id === activeTimeEntry.project_id)?.name || 'Okänt'}
        </p>
       )}
       {totalPauseTime > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
         Total paus: {Math.floor(totalPauseTime)} min
        </p>
       )}
      </div>
     </div>

     <div className="flex gap-2">
      {!isPaused ? (
       <button
        onClick={handlePause}
        disabled={loading}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
       >
        ⏸️ Pausa
       </button>
      ) : (
       <button
        onClick={handleResume}
        disabled={loading}
        className="flex-1 bg-success-500 hover:bg-success-600 text-white py-3 px-4 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
       >
        ▶️ Återuppta
       </button>
      )}
      <button
       onClick={handleCheckOut}
       disabled={loading}
       className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
       {loading ? 'Stämplar ut...' : '⏹️ Stämpla ut'}
      </button>
     </div>

     <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
      OB-timmar beräknas automatiskt vid utstämpling (Kväll: 18-22, Natt: 22-06, Helg: helger)
     </p>
    </div>
   )}
  </div>
 )
}

