'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { apiFetch } from '@/lib/http/fetcher'
import {
  ShieldCheck, AlertTriangle, FileWarning, Users, ClipboardCheck,
  HardHat, Flame, Zap, Construction, Mountain, Plus, X,
  Camera, Download,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────── */

interface Certificate {
  id: string
  employee_id: string
  certificate_type: string
  certificate_name: string
  issuer: string | null
  issued_date: string | null
  expiry_date: string | null
  status: string
  document_url: string | null
  employee_name?: string
}

interface Incident {
  id: string
  project_id: string | null
  reported_by: string
  incident_type: 'accident' | 'near_miss' | 'hazard' | 'observation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string | null
  photos: string[]
  status: string
  corrective_actions: string | null
  created_at: string
}

interface RiskTemplate {
  id: string
  name: string
  workType: string
  risks: Array<{
    hazard: string
    consequence: string
    probability: string
    severity: string
    mitigation: string
  }>
}

interface RiskAssessment {
  id: string
  project_id: string
  template_id: string
  title: string
  work_type: string
  risks: RiskTemplate['risks']
  created_at: string
}

interface AttendanceRecord {
  id: string
  person_name: string
  person_id_last4: string | null
  checked_in_at: string
  checked_out_at: string | null
  check_in_method: string
  notes: string | null
  employee_id: string | null
}

interface Project {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
  full_name?: string
}

interface ExpiringResponse {
  expiring_soon: Certificate[]
  expired: Certificate[]
}

/* ── Constants ────────────────────────────────────────────── */

const TABS = [
  { key: 'overview', label: 'Översikt' },
  { key: 'certificates', label: 'Certifikat' },
  { key: 'incidents', label: 'Incidenter' },
  { key: 'risk', label: 'Riskbedömning' },
  { key: 'attendance', label: 'Personalliggare' },
] as const

type TabKey = typeof TABS[number]['key']

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  low:      { label: 'LÅG',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  medium:   { label: 'MEDIUM',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  high:     { label: 'HÖG',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  critical: { label: 'KRITISK', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  accident:    'Olycka',
  near_miss:   'Tillbud',
  hazard:      'Fara',
  observation: 'Observation',
}

const CERT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  valid:         { label: 'Giltigt',     color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  expiring_soon: { label: 'Utgår snart', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  expired:       { label: 'Utgånget',    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  takarbete:      <Mountain className="w-6 h-6" />,
  rivning:        <Construction className="w-6 h-6" />,
  elarbete:       <Zap className="w-6 h-6" />,
  gravarbete:     <HardHat className="w-6 h-6" />,
  'heta-arbeten': <Flame className="w-6 h-6" />,
}

/* ── Helpers ──────────────────────────────────────────────── */

function computeCertStatus(expiryDate: string | null | undefined): string {
  if (!expiryDate) return 'valid'
  const now = new Date()
  const expiry = new Date(expiryDate)
  if (expiry < now) return 'expired'
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (expiry < thirtyDays) return 'expiring_soon'
  return 'valid'
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('sv-SE')
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m sedan`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h sedan`
  const days = Math.floor(hours / 24)
  return `${days}d sedan`
}

/* ── Loading Skeletons ────────────────────────────────────── */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-8 w-1/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────── */

export default function SafetyPage() {
  const { tenantId } = useTenant()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)

  // Overview
  const [expiringCerts, setExpiringCerts] = useState<Certificate[]>([])
  const [expiredCerts, setExpiredCerts] = useState<Certificate[]>([])
  const [openIncidents, setOpenIncidents] = useState<Incident[]>([])
  const [attendanceToday, setAttendanceToday] = useState<AttendanceRecord[]>([])

  // Certificates
  const [allCerts, setAllCerts] = useState<Certificate[]>([])
  const [certFilter, setCertFilter] = useState<string>('all')
  const [showCertModal, setShowCertModal] = useState(false)

  // Incidents
  const [allIncidents, setAllIncidents] = useState<Incident[]>([])
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('all')
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState<string>('all')
  const [showIncidentModal, setShowIncidentModal] = useState(false)

  // Risk assessments
  const [riskTemplates, setRiskTemplates] = useState<RiskTemplate[]>([])
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Attendance
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')

  // Shared
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Form: certificate
  const [certForm, setCertForm] = useState({
    employee_id: '', certificate_type: '', certificate_name: '',
    issuer: '', issued_date: '', expiry_date: '',
  })

  // Form: incident
  const [incidentForm, setIncidentForm] = useState({
    incident_type: 'observation' as Incident['incident_type'],
    severity: 'low' as Incident['severity'],
    description: '', project_id: '', location: '',
  })

  /* ── Data fetching ────────────────────────────────────────── */

  const fetchProjects = useCallback(async () => {
    if (!tenantId) return
    try {
      const data = await apiFetch<{ projects?: Project[] }>(`/api/projects/list?tenantId=${tenantId}`)
      const list = data.projects || []
      setProjects(list)
      if (list.length > 0 && !selectedProjectId) setSelectedProjectId(list[0].id)
    } catch { /* silent */ }
  }, [tenantId, selectedProjectId])

  const fetchEmployees = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await apiFetch<{ success: boolean; data: { employees?: Employee[] } }>('/api/employees/list')
      setEmployees(res.data?.employees || [])
    } catch { /* silent */ }
  }, [tenantId])

  const fetchOverview = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const [expiringRes, incidentsRes] = await Promise.allSettled([
        apiFetch<{ success: boolean; data: ExpiringResponse }>('/api/safety/certificates/expiring'),
        apiFetch<{ success: boolean; data: Incident[] }>('/api/safety/incidents?status=reported,investigating'),
      ])
      if (expiringRes.status === 'fulfilled') {
        setExpiringCerts(expiringRes.value.data?.expiring_soon || [])
        setExpiredCerts(expiringRes.value.data?.expired || [])
      }
      if (incidentsRes.status === 'fulfilled') {
        setOpenIncidents(incidentsRes.value.data || [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [tenantId])

  const fetchAttendance = useCallback(async (projectId: string) => {
    if (!tenantId || !projectId) return
    try {
      const res = await apiFetch<{ success: boolean; data: AttendanceRecord[] }>(`/api/projects/${projectId}/attendance`)
      setAttendanceToday(res.data || [])
      setAttendanceRecords(res.data || [])
    } catch {
      setAttendanceToday([])
      setAttendanceRecords([])
    }
  }, [tenantId])

  const fetchCertificates = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: Certificate[] }>('/api/safety/certificates')
      const withStatus = (res.data || []).map(c => ({
        ...c,
        status: computeCertStatus(c.expiry_date),
        employee_name:
          employees.find(e => e.id === c.employee_id)?.full_name
          || employees.find(e => e.id === c.employee_id)?.name
          || c.employee_id,
      }))
      setAllCerts(withStatus)
    } catch { setAllCerts([]) }
    finally { setLoading(false) }
  }, [tenantId, employees])

  const fetchIncidents = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: Incident[] }>('/api/safety/incidents')
      setAllIncidents(res.data || [])
    } catch { setAllIncidents([]) }
    finally { setLoading(false) }
  }, [tenantId])

  const fetchRiskAssessments = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: { templates: RiskTemplate[]; assessments: RiskAssessment[] } }>('/api/safety/risk-assessments')
      setRiskTemplates(res.data?.templates || [])
      setRiskAssessments(res.data?.assessments || [])
    } catch {
      setRiskTemplates([])
      setRiskAssessments([])
    } finally { setLoading(false) }
  }, [tenantId])

  // Initial
  useEffect(() => {
    if (!tenantId) return
    fetchProjects()
    fetchEmployees()
  }, [tenantId, fetchProjects, fetchEmployees])

  // Tab-specific
  useEffect(() => {
    if (!tenantId) return
    switch (activeTab) {
      case 'overview':
        fetchOverview()
        if (selectedProjectId) fetchAttendance(selectedProjectId)
        break
      case 'certificates': fetchCertificates(); break
      case 'incidents': fetchIncidents(); break
      case 'risk': fetchRiskAssessments(); break
      case 'attendance':
        if (selectedProjectId) fetchAttendance(selectedProjectId)
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tenantId, selectedProjectId])

  /* ── Actions ──────────────────────────────────────────────── */

  const handleAddCertificate = async () => {
    if (!certForm.employee_id || !certForm.certificate_type || !certForm.certificate_name) return
    setSubmitting(true)
    try {
      await apiFetch('/api/safety/certificates', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: certForm.employee_id,
          certificate_type: certForm.certificate_type,
          certificate_name: certForm.certificate_name,
          issuer: certForm.issuer || undefined,
          issued_date: certForm.issued_date || undefined,
          expiry_date: certForm.expiry_date || undefined,
        }),
      })
      setShowCertModal(false)
      setCertForm({ employee_id: '', certificate_type: '', certificate_name: '', issuer: '', issued_date: '', expiry_date: '' })
      fetchCertificates()
    } catch { /* apiFetch throws */ }
    finally { setSubmitting(false) }
  }

  const handleReportIncident = async () => {
    if (!incidentForm.description) return
    setSubmitting(true)
    try {
      const reporterId = employees[0]?.id
      if (!reporterId) return
      await apiFetch('/api/safety/incidents', {
        method: 'POST',
        body: JSON.stringify({
          ...incidentForm,
          reported_by: reporterId,
          project_id: incidentForm.project_id || undefined,
        }),
      })
      setShowIncidentModal(false)
      setIncidentForm({ incident_type: 'observation', severity: 'low', description: '', project_id: '', location: '' })
      fetchIncidents()
    } catch { /* apiFetch throws */ }
    finally { setSubmitting(false) }
  }

  const handleCreateRiskAssessment = async (templateId: string) => {
    if (!selectedProjectId) return
    setSubmitting(true)
    try {
      await apiFetch('/api/safety/risk-assessments', {
        method: 'POST',
        body: JSON.stringify({ template_id: templateId, project_id: selectedProjectId }),
      })
      setSelectedTemplate(null)
      fetchRiskAssessments()
    } catch { /* apiFetch throws */ }
    finally { setSubmitting(false) }
  }

  const handleCheckIn = async (personName: string) => {
    if (!selectedProjectId || !personName) return
    setSubmitting(true)
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ person_name: personName, check_in_method: 'manual' }),
      })
      fetchAttendance(selectedProjectId)
    } catch { /* apiFetch throws */ }
    finally { setSubmitting(false) }
  }

  const handleCheckOut = async (attendanceId: string) => {
    if (!selectedProjectId) return
    setSubmitting(true)
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/attendance/${attendanceId}/checkout`, { method: 'POST' })
      fetchAttendance(selectedProjectId)
    } catch { /* apiFetch throws */ }
    finally { setSubmitting(false) }
  }

  const handleExportCSV = () => {
    if (!selectedProjectId || !exportFrom || !exportTo) return
    window.open(`/api/projects/${selectedProjectId}/attendance/export?from=${exportFrom}&to=${exportTo}`, '_blank')
  }

  /* ── Computed ─────────────────────────────────────────────── */

  const filteredCerts = allCerts.filter(c =>
    certFilter === 'all' ? true : computeCertStatus(c.expiry_date) === certFilter
  )

  const filteredIncidents = allIncidents.filter(i => {
    if (incidentTypeFilter !== 'all' && i.incident_type !== incidentTypeFilter) return false
    if (incidentSeverityFilter !== 'all' && i.severity !== incidentSeverityFilter) return false
    return true
  })

  const onSiteCount = attendanceToday.filter(a => !a.checked_out_at).length
  const defaultProject = projects.find(p => p.id === selectedProjectId)

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-7 h-7 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KMA &amp; Säkerhet</h1>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 mb-8">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════════ Översikt ═══════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-5">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                      <FileWarning className="w-5 h-5" />
                      <span className="text-sm font-medium">Utgångna certifikat</span>
                    </div>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">{expiredCerts.length}</p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">Kräver omedelbar åtgärd</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-medium">Utgår inom 30 dagar</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{expiringCerts.length}</p>
                    <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">Planera förnyelse</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-medium">Öppna incidenter</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{openIncidents.length}</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Under utredning</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-medium">På plats idag</span>
                    </div>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{onSiteCount}</p>
                    <p className="text-xs text-green-500 dark:text-green-400 mt-1">Incheckade just nu</p>
                  </div>
                </div>
              )}

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Certs needing action */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Certifikat som kräver åtgärd
                  </h2>
                  {loading ? <TableSkeleton rows={4} /> : (
                    [...expiredCerts, ...expiringCerts].length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm py-4">Inga certifikat kräver åtgärd just nu.</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {[...expiredCerts, ...expiringCerts].map(cert => {
                          const status = computeCertStatus(cert.expiry_date)
                          const isExpired = status === 'expired'
                          const empName = employees.find(e => e.id === cert.employee_id)?.full_name
                            || employees.find(e => e.id === cert.employee_id)?.name || '—'
                          return (
                            <div key={cert.id}
                              className={`border-l-4 ${isExpired ? 'border-l-red-500' : 'border-l-amber-500'} bg-gray-50 dark:bg-gray-700/50 rounded-r-lg p-3`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">{empName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{cert.certificate_name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(cert.expiry_date)}</p>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${CERT_STATUS_LABELS[status]?.color || ''}`}>
                                    {CERT_STATUS_LABELS[status]?.label || status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  {/* Recent incidents */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Senaste incidenter</h2>
                      <button
                        onClick={() => { setActiveTab('incidents'); setShowIncidentModal(true) }}
                        className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
                      >
                        <Plus className="w-4 h-4" /> Rapportera
                      </button>
                    </div>
                    {loading ? <TableSkeleton rows={3} /> : openIncidents.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm py-4">Inga öppna incidenter.</p>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {openIncidents.slice(0, 5).map(inc => (
                          <div key={inc.id} className="flex items-start justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_LABELS[inc.severity]?.color || ''}`}>
                                  {SEVERITY_LABELS[inc.severity]?.label || inc.severity}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {INCIDENT_TYPE_LABELS[inc.incident_type] || inc.incident_type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white truncate">{inc.description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(inc.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* On-site today */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      På plats idag{defaultProject ? ` — ${defaultProject.name}` : ''}
                    </h2>
                    {loading ? (
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-28" />)}
                      </div>
                    ) : attendanceToday.filter(a => !a.checked_out_at).length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Ingen incheckad just nu.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {attendanceToday.filter(a => !a.checked_out_at).map(a => (
                          <span key={a.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            {a.person_name}
                            <span className="text-xs text-green-500 dark:text-green-400 ml-1">{formatTime(a.checked_in_at)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ Certifikat ═══════════════ */}
          {activeTab === 'certificates' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Status:</label>
                  <select value={certFilter} onChange={e => setCertFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white">
                    <option value="all">Alla</option>
                    <option value="valid">Giltiga</option>
                    <option value="expiring_soon">Utgår snart</option>
                    <option value="expired">Utgångna</option>
                  </select>
                </div>
                <button onClick={() => setShowCertModal(true)}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Lägg till certifikat
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? <div className="p-6"><TableSkeleton rows={6} /></div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Anställd</th>
                          <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Certifikattyp</th>
                          <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium hidden sm:table-cell">Utfärdare</th>
                          <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Utgångsdatum</th>
                          <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredCerts.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Inga certifikat hittades.</td></tr>
                        ) : filteredCerts.map(cert => {
                          const status = computeCertStatus(cert.expiry_date)
                          return (
                            <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                              <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{cert.employee_name}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{cert.certificate_name}</td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{cert.issuer || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(cert.expiry_date)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CERT_STATUS_LABELS[status]?.color || ''}`}>
                                  {CERT_STATUS_LABELS[status]?.label || status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════ Incidenter ═══════════════ */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <select value={incidentTypeFilter} onChange={e => setIncidentTypeFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white">
                    <option value="all">Alla typer</option>
                    <option value="accident">Olycka</option>
                    <option value="near_miss">Tillbud</option>
                    <option value="hazard">Fara</option>
                    <option value="observation">Observation</option>
                  </select>
                  <select value={incidentSeverityFilter} onChange={e => setIncidentSeverityFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white">
                    <option value="all">Alla allvarligheter</option>
                    <option value="low">Låg</option>
                    <option value="medium">Medium</option>
                    <option value="high">Hög</option>
                    <option value="critical">Kritisk</option>
                  </select>
                </div>
                <button onClick={() => setShowIncidentModal(true)}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Rapportera incident
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Inga incidenter matchade filtret.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredIncidents.map(inc => {
                    const typeIcon = inc.incident_type === 'accident'
                      ? <AlertTriangle className="w-5 h-5 text-red-500" />
                      : inc.incident_type === 'near_miss'
                      ? <AlertTriangle className="w-5 h-5 text-amber-500" />
                      : inc.incident_type === 'hazard'
                      ? <FileWarning className="w-5 h-5 text-orange-500" />
                      : <ClipboardCheck className="w-5 h-5 text-blue-500" />
                    return (
                      <div key={inc.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{typeIcon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_LABELS[inc.severity]?.color || ''}`}>
                                {SEVERITY_LABELS[inc.severity]?.label || inc.severity}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {INCIDENT_TYPE_LABELS[inc.incident_type]}
                              </span>
                              {inc.photos?.length > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                  <Camera className="w-3 h-3" /> {inc.photos.length}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">{inc.description}</p>
                            {inc.location && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Plats: {inc.location}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(inc.created_at)}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {inc.status || 'reported'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ Riskbedömning ═══════════════ */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Projekt:</label>
                <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white">
                  <option value="">Välj projekt...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Arbetstyper</h2>
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {riskTemplates.map(tmpl => (
                      <button key={tmpl.id}
                        onClick={() => { if (selectedProjectId) setSelectedTemplate(tmpl.id === selectedTemplate ? null : tmpl.id) }}
                        disabled={!selectedProjectId || submitting}
                        className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${
                          selectedTemplate === tmpl.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${!selectedProjectId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className={selectedTemplate === tmpl.id ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}>
                          {TEMPLATE_ICONS[tmpl.id] || <ClipboardCheck className="w-6 h-6" />}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{tmpl.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{tmpl.risks.length} risker</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedTemplate && selectedProjectId && (
                  <div className="mt-4 flex justify-center">
                    <button onClick={() => handleCreateRiskAssessment(selectedTemplate)} disabled={submitting}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                      {submitting ? 'Skapar...' : 'Skapa riskbedömning'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Befintliga riskbedömningar</h2>
                {loading ? <TableSkeleton rows={4} /> : riskAssessments.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <ClipboardCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Inga riskbedömningar skapade ännu.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {riskAssessments.map(ra => {
                      const project = projects.find(p => p.id === ra.project_id)
                      return (
                        <div key={ra.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">{ra.title}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{project?.name || ra.project_id}</p>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(ra.created_at)}</span>
                          </div>
                          <div className="space-y-2">
                            {(ra.risks || []).slice(0, 3).map((risk, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                  risk.severity === 'high' ? 'bg-red-500' : risk.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                                }`} />
                                <span className="text-gray-700 dark:text-gray-300">{risk.hazard}</span>
                              </div>
                            ))}
                            {(ra.risks || []).length > 3 && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 pl-4">+{(ra.risks || []).length - 3} till...</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════ Personalliggare ═══════════════ */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Projekt:</label>
                  <select value={selectedProjectId}
                    onChange={e => { setSelectedProjectId(e.target.value); if (e.target.value) fetchAttendance(e.target.value) }}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white min-w-[200px]">
                    <option value="">Välj projekt...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {selectedProjectId && (
                  <button
                    onClick={() => { const name = prompt('Ange namn för incheckning:'); if (name) handleCheckIn(name) }}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    <Plus className="w-4 h-4" /> Checka in
                  </button>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Dagens närvaro</h2>
                </div>
                {!selectedProjectId ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">Välj ett projekt för att se närvaro.</div>
                ) : loading ? (
                  <div className="p-6"><TableSkeleton rows={5} /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Namn</th>
                          <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Incheckning</th>
                          <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Utcheckning</th>
                          <th className="text-right px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Åtgärd</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {attendanceRecords.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Ingen närvaro registrerad idag.</td></tr>
                        ) : attendanceRecords.map(rec => (
                          <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{rec.person_name}</td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatTime(rec.checked_in_at)}</td>
                            <td className="px-4 py-3">
                              {rec.checked_out_at ? (
                                <span className="text-gray-700 dark:text-gray-300">{formatTime(rec.checked_out_at)}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> På plats
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!rec.checked_out_at && (
                                <button onClick={() => handleCheckOut(rec.id)} disabled={submitting}
                                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50">
                                  Checka ut
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Export */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Exportera personalliggare</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Från</label>
                    <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
                      className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Till</label>
                    <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)}
                      className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <button onClick={handleExportCSV} disabled={!selectedProjectId || !exportFrom || !exportTo}
                    className="flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Download className="w-4 h-4" /> Exportera CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ Add Certificate Modal ═══════════════ */}
          {showCertModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lägg till certifikat</h2>
                  <button onClick={() => setShowCertModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anställd</label>
                    <select value={certForm.employee_id} onChange={e => setCertForm({ ...certForm, employee_id: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option value="">Välj anställd...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name || emp.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certifikattyp</label>
                    <input type="text" placeholder="t.ex. Heta arbeten, Ställningsbyggnad"
                      value={certForm.certificate_type} onChange={e => setCertForm({ ...certForm, certificate_type: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certifikatnamn</label>
                    <input type="text" placeholder="t.ex. SRY Heta Arbeten"
                      value={certForm.certificate_name} onChange={e => setCertForm({ ...certForm, certificate_name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utfärdare</label>
                    <input type="text" placeholder="t.ex. Brandskyddsföreningen"
                      value={certForm.issuer} onChange={e => setCertForm({ ...certForm, issuer: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utfärdat</label>
                      <input type="date" value={certForm.issued_date} onChange={e => setCertForm({ ...certForm, issued_date: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utgår</label>
                      <input type="date" value={certForm.expiry_date} onChange={e => setCertForm({ ...certForm, expiry_date: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowCertModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Avbryt</button>
                  <button onClick={handleAddCertificate}
                    disabled={submitting || !certForm.employee_id || !certForm.certificate_type || !certForm.certificate_name}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {submitting ? 'Sparar...' : 'Lägg till'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ Report Incident Modal ═══════════════ */}
          {showIncidentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rapportera incident</h2>
                  <button onClick={() => setShowIncidentModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ</label>
                      <select value={incidentForm.incident_type}
                        onChange={e => setIncidentForm({ ...incidentForm, incident_type: e.target.value as Incident['incident_type'] })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white">
                        <option value="observation">Observation</option>
                        <option value="near_miss">Tillbud</option>
                        <option value="hazard">Fara</option>
                        <option value="accident">Olycka</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allvarlighet</label>
                      <select value={incidentForm.severity}
                        onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value as Incident['severity'] })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white">
                        <option value="low">Låg</option>
                        <option value="medium">Medium</option>
                        <option value="high">Hög</option>
                        <option value="critical">Kritisk</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Projekt</label>
                    <select value={incidentForm.project_id}
                      onChange={e => setIncidentForm({ ...incidentForm, project_id: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option value="">Inget projekt</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beskrivning</label>
                    <textarea rows={3} placeholder="Beskriv vad som hände..."
                      value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plats</label>
                    <input type="text" placeholder="t.ex. Våning 3, kök"
                      value={incidentForm.location} onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowIncidentModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Avbryt</button>
                  <button onClick={handleReportIncident}
                    disabled={submitting || !incidentForm.description}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {submitting ? 'Skickar...' : 'Rapportera'}
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
