'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { apiFetch } from '@/lib/http/fetcher'
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, X,
  AlertTriangle, CheckCircle2,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────── */

interface ScheduleSlot {
  id: string
  employee_id: string
  project_id: string
  start_time: string
  end_time: string
  status: string
  shift_type?: string
  notes?: string | null
}

interface Employee {
  id: string
  name: string
  full_name?: string
}

interface Project {
  id: string
  name: string
}

interface ConflictResult {
  hasConflict: boolean
  conflicts: Array<{ id: string; start_time: string; end_time: string }>
}

/* ── Constants ────────────────────────────────────────────── */

const DAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre'] as const

const PROJECT_COLORS = [
  'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
  'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
  'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
]

const VACATION_STYLE = 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
const SICK_STYLE = 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'

/* ── Helpers ──────────────────────────────────────────────── */

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

/* ── Loading Skeletons ────────────────────────────────────── */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
}

function GridSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="h-14 w-28 flex-shrink-0" />
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-14 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────── */

export default function SchedulingPage() {
  const { tenantId } = useTenant()
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()))

  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([])

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [modalEmployee, setModalEmployee] = useState<string>('')
  const [modalDate, setModalDate] = useState<string>('')
  const [modalProject, setModalProject] = useState<string>('')
  const [modalShiftType, setModalShiftType] = useState<string>('regular')
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Compliance
  const [complianceWarnings, setComplianceWarnings] = useState<string[]>([])

  // Project color map
  const projectColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    projects.forEach((p, i) => {
      map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length]
    })
    return map
  }, [projects])

  // Week days
  const weekDays = useMemo(() =>
    Array.from({ length: 5 }).map((_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  )

  const weekNumber = getWeekNumber(currentWeekStart)
  const weekYear = currentWeekStart.getFullYear()

  /* ── Data fetching ────────────────────────────────────────── */

  const fetchEmployees = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await apiFetch<{ success: boolean; data: { employees?: Employee[] } }>('/api/employees/list')
      setEmployees(res.data?.employees || [])
    } catch { /* silent */ }
  }, [tenantId])

  const fetchProjects = useCallback(async () => {
    if (!tenantId) return
    try {
      const data = await apiFetch<{ projects?: Project[] }>(`/api/projects/list?tenantId=${tenantId}`)
      setProjects(data.projects || [])
    } catch { /* silent */ }
  }, [tenantId])

  const fetchSchedules = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const startDate = formatDateISO(currentWeekStart)
      const endDate = formatDateISO(addDays(currentWeekStart, 4))
      const res = await apiFetch<{ success: boolean; data: ScheduleSlot[] }>(
        `/api/schedules?start_date=${startDate}&end_date=${endDate}`
      )
      setSchedules(res.data || [])
    } catch {
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, currentWeekStart])

  useEffect(() => {
    if (!tenantId) return
    fetchEmployees()
    fetchProjects()
  }, [tenantId, fetchEmployees, fetchProjects])

  useEffect(() => {
    if (!tenantId) return
    fetchSchedules()
  }, [tenantId, fetchSchedules])

  // Compliance check
  useEffect(() => {
    if (employees.length === 0 || schedules.length === 0) {
      setComplianceWarnings([])
      return
    }
    const warnings: string[] = []
    employees.forEach(emp => {
      const empSchedules = schedules.filter(s => s.employee_id === emp.id && s.status !== 'cancelled')
      const totalHours = empSchedules.reduce((sum, s) => {
        return sum + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 3600000
      }, 0)
      if (totalHours > 48) {
        warnings.push(`${emp.full_name || emp.name}: ${totalHours.toFixed(0)}h (max 48h/vecka)`)
      }
    })
    setComplianceWarnings(warnings)
  }, [employees, schedules])

  /* ── Grid data ────────────────────────────────────────────── */

  const getSlotForCell = useCallback((employeeId: string, date: Date): ScheduleSlot | null => {
    const dateStr = formatDateISO(date)
    return schedules.find(s => {
      if (s.employee_id !== employeeId || s.status === 'cancelled') return false
      const slotDate = new Date(s.start_time).toISOString().split('T')[0]
      return slotDate === dateStr
    }) || null
  }, [schedules])

  /* ── Actions ──────────────────────────────────────────────── */

  const openAssignModal = (employeeId: string, date: Date) => {
    setModalEmployee(employeeId)
    setModalDate(formatDateISO(date))
    setModalProject('')
    setModalShiftType('regular')
    setConflictWarning(null)
    setShowModal(true)
  }

  const checkConflicts = async () => {
    if (!modalEmployee || !modalDate) return
    try {
      const startTime = `${modalDate}T07:00:00Z`
      const endTime = `${modalDate}T16:00:00Z`
      const data = await apiFetch<ConflictResult>(
        `/api/schedules/conflicts?employee_id=${modalEmployee}&start_time=${startTime}&end_time=${endTime}`
      )
      if (data.hasConflict) {
        setConflictWarning('Det finns redan ett schemalagt pass som överlappar.')
      } else {
        setConflictWarning(null)
      }
    } catch {
      // Ignore conflict check errors
    }
  }

  useEffect(() => {
    if (showModal && modalEmployee && modalDate) {
      checkConflicts()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, modalEmployee, modalDate])

  const handleCreateSchedule = async () => {
    if (!modalEmployee || !modalDate || !modalProject) return
    setSubmitting(true)
    try {
      const startTime = `${modalDate}T07:00:00Z`
      const endTime = modalShiftType === 'overtime'
        ? `${modalDate}T19:00:00Z`
        : modalShiftType === 'on-call'
        ? `${modalDate}T23:00:00Z`
        : `${modalDate}T16:00:00Z`

      await apiFetch('/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: modalEmployee,
          project_id: modalProject,
          start_time: startTime,
          end_time: endTime,
          shift_type: modalShiftType,
          status: 'scheduled',
        }),
      })
      setShowModal(false)
      fetchSchedules()
    } catch { /* apiFetch throws */ }
    finally { setSubmitting(false) }
  }

  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7))
  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7))

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-7 h-7 text-primary-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schemaläggning</h1>
            </div>

            {/* Week navigation */}
            <div className="flex items-center gap-3">
              <button onClick={prevWeek}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[160px] text-center">
                Vecka {weekNumber}, {weekYear}
              </span>
              <button onClick={nextWeek}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conflict warning banner */}
          {complianceWarnings.length > 0 && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {complianceWarnings.length} anställda överskrider veckomax (Arbetstidslagen)
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {complianceWarnings.map((w, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400">{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Desktop: Weekly grid */}
          <div className="hidden md:block">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {loading ? (
                <div className="p-6"><GridSkeleton /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium text-sm w-[140px]">
                          Anställd
                        </th>
                        {weekDays.map((day, i) => (
                          <th key={i} className="text-center px-2 py-3 text-gray-600 dark:text-gray-300 font-medium text-sm">
                            <div>{DAY_LABELS[i]}</div>
                            <div className="text-xs font-normal text-gray-400 dark:text-gray-500">{formatDateShort(day)}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {employees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Inga anställda hittades.
                          </td>
                        </tr>
                      ) : employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {emp.full_name || emp.name}
                          </td>
                          {weekDays.map((day, dayIdx) => {
                            const slot = getSlotForCell(emp.id, day)
                            const project = slot ? projects.find(p => p.id === slot.project_id) : null

                            // Special states
                            const isVacation = slot?.notes?.toLowerCase().includes('semester')
                            const isSick = slot?.notes?.toLowerCase().includes('sjuk') || slot?.status === 'sick'

                            if (isVacation) {
                              return (
                                <td key={dayIdx} className="px-1 py-1.5">
                                  <div className={`rounded-lg border px-2 py-2 text-center text-xs font-medium ${VACATION_STYLE}`}>
                                    Semester
                                  </div>
                                </td>
                              )
                            }

                            if (isSick) {
                              return (
                                <td key={dayIdx} className="px-1 py-1.5">
                                  <div className={`rounded-lg border px-2 py-2 text-center text-xs font-medium ${SICK_STYLE}`}>
                                    Sjuk
                                  </div>
                                </td>
                              )
                            }

                            if (slot && project) {
                              const colorClass = projectColorMap[slot.project_id] || PROJECT_COLORS[0]
                              const hasConflict = schedules.filter(s =>
                                s.employee_id === emp.id &&
                                s.status !== 'cancelled' &&
                                new Date(s.start_time).toISOString().split('T')[0] === formatDateISO(day)
                              ).length > 1

                              return (
                                <td key={dayIdx} className="px-1 py-1.5">
                                  <div className={`rounded-lg border px-2 py-2 text-xs font-medium ${colorClass} ${hasConflict ? 'ring-2 ring-red-500' : ''}`}>
                                    <div className="flex items-center gap-1">
                                      {hasConflict && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                                      <span className="truncate">{project.name}</span>
                                    </div>
                                    {slot.shift_type && slot.shift_type !== 'regular' && (
                                      <span className="text-[10px] opacity-70 block mt-0.5">
                                        {slot.shift_type === 'overtime' ? 'Övertid' : slot.shift_type === 'on-call' ? 'Jour' : slot.shift_type}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )
                            }

                            // Empty cell
                            return (
                              <td key={dayIdx} className="px-1 py-1.5">
                                <button
                                  onClick={() => openAssignModal(emp.id, day)}
                                  className="w-full h-12 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-stone-50/50 dark:bg-stone-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex items-center justify-center group"
                                >
                                  <Plus className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-400" />
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Stacked view */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <Skeleton className="h-5 w-1/3 mb-3" />
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : employees.map(emp => (
              <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-3">
                  {emp.full_name || emp.name}
                </h3>
                <div className="space-y-2">
                  {weekDays.map((day, dayIdx) => {
                    const slot = getSlotForCell(emp.id, day)
                    const project = slot ? projects.find(p => p.id === slot.project_id) : null
                    const isVacation = slot?.notes?.toLowerCase().includes('semester')
                    const isSick = slot?.notes?.toLowerCase().includes('sjuk') || slot?.status === 'sick'

                    return (
                      <div key={dayIdx} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">
                          {DAY_LABELS[dayIdx]} {formatDateShort(day)}
                        </span>
                        {isVacation ? (
                          <div className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${VACATION_STYLE}`}>
                            Semester
                          </div>
                        ) : isSick ? (
                          <div className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${SICK_STYLE}`}>
                            Sjuk
                          </div>
                        ) : slot && project ? (
                          <div className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${projectColorMap[slot.project_id] || PROJECT_COLORS[0]}`}>
                            {project.name}
                            {slot.shift_type && slot.shift_type !== 'regular' && (
                              <span className="ml-2 opacity-70">
                                ({slot.shift_type === 'overtime' ? 'Övertid' : slot.shift_type === 'on-call' ? 'Jour' : slot.shift_type})
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignModal(emp.id, day)}
                            className="flex-1 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-stone-50/50 dark:bg-stone-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/10 px-3 py-2 text-xs text-gray-400 dark:text-gray-600 text-center"
                          >
                            + Tilldela
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Compliance footer */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3">
            <div className="flex items-center gap-2 text-sm">
              {complianceWarnings.length === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 dark:text-green-400 font-medium">Alla inom gräns (Arbetstidslagen)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    {complianceWarnings.length} anställda överskrider veckomax
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Assignment modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tilldela pass</h2>
                  <button onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {conflictWarning && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{conflictWarning}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anställd</label>
                    <p className="text-sm text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                      {employees.find(e => e.id === modalEmployee)?.full_name
                        || employees.find(e => e.id === modalEmployee)?.name || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Datum</label>
                    <p className="text-sm text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                      {modalDate}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Projekt</label>
                    <select value={modalProject} onChange={e => setModalProject(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option value="">Välj projekt...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skifttyp</label>
                    <select value={modalShiftType} onChange={e => setModalShiftType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option value="regular">Ordinarie (07:00–16:00)</option>
                      <option value="overtime">Övertid (07:00–19:00)</option>
                      <option value="on-call">Jour (07:00–23:00)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Avbryt
                  </button>
                  <button onClick={handleCreateSchedule}
                    disabled={submitting || !modalProject}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {submitting ? 'Sparar...' : 'Tilldela'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
