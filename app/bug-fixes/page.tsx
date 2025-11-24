'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'

interface Bug {
  id: string
  page: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'fixed' | 'closed'
  reportedAt: string
  fixedAt?: string
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
}

interface PageStatus {
  path: string
  name: string
  tested: boolean
  working: boolean
  bugs: number
  lastTested?: string
}

const ALL_PAGES: PageStatus[] = [
  { path: '/dashboard', name: 'Dashboard', tested: false, working: false, bugs: 0 },
  { path: '/employees', name: 'Anställda', tested: false, working: false, bugs: 0 },
  { path: '/employees/new', name: 'Ny anställd', tested: false, working: false, bugs: 0 },
  { path: '/projects', name: 'Projekt', tested: false, working: false, bugs: 0 },
  { path: '/projects/new', name: 'Nytt projekt', tested: false, working: false, bugs: 0 },
  { path: '/projects/archive', name: 'Arkiv', tested: false, working: false, bugs: 0 },
  { path: '/clients', name: 'Kunder', tested: false, working: false, bugs: 0 },
  { path: '/clients/new', name: 'Ny kund', tested: false, working: false, bugs: 0 },
  { path: '/quotes', name: 'Offerter', tested: false, working: false, bugs: 0 },
  { path: '/quotes/new', name: 'Ny offert', tested: false, working: false, bugs: 0 },
  { path: '/invoices', name: 'Fakturor', tested: false, working: false, bugs: 0 },
  { path: '/invoices/new', name: 'Ny faktura', tested: false, working: false, bugs: 0 },
  { path: '/supplier-invoices', name: 'Leverantörsfakturor', tested: false, working: false, bugs: 0 },
  { path: '/supplier-invoices/new', name: 'Ny leverantörsfaktura', tested: false, working: false, bugs: 0 },
  { path: '/materials', name: 'Materialdatabas', tested: false, working: false, bugs: 0 },
  { path: '/materials/new', name: 'Nytt material', tested: false, working: false, bugs: 0 },
  { path: '/payroll/periods', name: 'Löneexport', tested: false, working: false, bugs: 0 },
  { path: '/payroll', name: 'Lönespec', tested: false, working: false, bugs: 0 },
  { path: '/reports', name: 'Rapporter', tested: false, working: false, bugs: 0 },
  { path: '/reports/new', name: 'Ny rapport', tested: false, working: false, bugs: 0 },
  { path: '/calendar', name: 'Kalender', tested: false, working: false, bugs: 0 },
  { path: '/work-orders', name: 'Arbetsordrar', tested: false, working: false, bugs: 0 },
  { path: '/analytics', name: 'Analytics', tested: false, working: false, bugs: 0 },
  { path: '/rot', name: 'ROT-avdrag', tested: false, working: false, bugs: 0 },
  { path: '/rot/new', name: 'Ny ROT-ansökan', tested: false, working: false, bugs: 0 },
  { path: '/aeta', name: 'ÄTA', tested: false, working: false, bugs: 0 },
  { path: '/kma', name: 'KMA', tested: false, working: false, bugs: 0 },
  { path: '/delivery-notes', name: 'Följesedlar', tested: false, working: false, bugs: 0 },
  { path: '/workflows', name: 'Arbetsflöden', tested: false, working: false, bugs: 0 },
  { path: '/settings/integrations', name: 'Integrationer', tested: false, working: false, bugs: 0 },
  { path: '/settings/utseende', name: 'Utseende', tested: false, working: false, bugs: 0 },
  { path: '/feedback', name: 'Feedback', tested: false, working: false, bugs: 0 },
  { path: '/faq', name: 'FAQ', tested: false, working: false, bugs: 0 },
  { path: '/admin', name: 'Admin', tested: false, working: false, bugs: 0 },
  { path: '/admin/debug', name: 'Admin Debug', tested: false, working: false, bugs: 0 },
  { path: '/login', name: 'Login', tested: false, working: false, bugs: 0 },
  { path: '/onboarding', name: 'Onboarding', tested: false, working: false, bugs: 0 },
]

export default function BugFixesPage() {
  const router = useRouter()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [pages, setPages] = useState<PageStatus[]>(ALL_PAGES)
  const [bugs, setBugs] = useState<Bug[]>([])
  const [showBugForm, setShowBugForm] = useState(false)
  const [selectedPage, setSelectedPage] = useState<string>('')
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    severity: 'medium' as Bug['severity'],
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
  })
  const [filter, setFilter] = useState<'all' | 'open' | 'fixed'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | Bug['severity']>('all')

  // Check admin access
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Kontrollerar åtkomst...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🔒 Åtkomst nekad
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Denna sida är endast tillgänglig för utvecklare och administratörer.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tillbaka till Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Load from localStorage on mount
  useEffect(() => {
    const savedPages = localStorage.getItem('bug-fixes-pages')
    const savedBugs = localStorage.getItem('bug-fixes-bugs')
    
    if (savedPages) {
      setPages(JSON.parse(savedPages))
    }
    if (savedBugs) {
      setBugs(JSON.parse(savedBugs))
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('bug-fixes-pages', JSON.stringify(pages))
  }, [pages])

  useEffect(() => {
    localStorage.setItem('bug-fixes-bugs', JSON.stringify(bugs))
    
    // Update page bug counts
    setPages(prev => prev.map(page => ({
      ...page,
      bugs: bugs.filter(bug => bug.page === page.path && bug.status !== 'fixed' && bug.status !== 'closed').length
    })))
  }, [bugs])

  const markPageTested = (path: string, working: boolean) => {
    setPages(prev => prev.map(page => 
      page.path === path 
        ? { ...page, tested: true, working, lastTested: new Date().toISOString() }
        : page
    ))
    toast.success(working ? 'Sidan fungerar korrekt!' : 'Sidan har problem - lägg till bugg nedan')
  }

  const addBug = () => {
    if (!bugForm.title || !bugForm.description || !selectedPage) {
      toast.error('Fyll i alla obligatoriska fält')
      return
    }

    const newBug: Bug = {
      id: Date.now().toString(),
      page: selectedPage,
      title: bugForm.title,
      description: bugForm.description,
      severity: bugForm.severity,
      status: 'open',
      reportedAt: new Date().toISOString(),
      stepsToReproduce: bugForm.stepsToReproduce,
      expectedBehavior: bugForm.expectedBehavior,
      actualBehavior: bugForm.actualBehavior,
    }

    setBugs(prev => [newBug, ...prev])
    setShowBugForm(false)
    setBugForm({
      title: '',
      description: '',
      severity: 'medium',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
    })
    setSelectedPage('')
    toast.success('Bugg rapporterad!')
  }

  const updateBugStatus = (bugId: string, status: Bug['status']) => {
    setBugs(prev => prev.map(bug => 
      bug.id === bugId 
        ? { ...bug, status, fixedAt: status === 'fixed' ? new Date().toISOString() : bug.fixedAt }
        : bug
    ))
    toast.success('Buggstatus uppdaterad!')
  }

  const deleteBug = (bugId: string) => {
    setBugs(prev => prev.filter(bug => bug.id !== bugId))
    toast.success('Bugg borttagen!')
  }

  const filteredBugs = bugs.filter(bug => {
    if (filter === 'open' && bug.status !== 'open') return false
    if (filter === 'fixed' && bug.status !== 'fixed') return false
    if (severityFilter !== 'all' && bug.severity !== severityFilter) return false
    return true
  })

  const stats = {
    total: pages.length,
    tested: pages.filter(p => p.tested).length,
    working: pages.filter(p => p.working).length,
    totalBugs: bugs.length,
    openBugs: bugs.filter(b => b.status === 'open').length,
    fixedBugs: bugs.filter(b => b.status === 'fixed').length,
  }

  const severityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  }

  const statusColors = {
    open: 'bg-red-50 text-red-700 border-red-200',
    'in-progress': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    fixed: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🐛 Bug Fixes & Testing
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Systematisk testning och buggspårning för hela appen
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400">Sidor testade</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.tested}/{stats.total}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400">Fungerar korrekt</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.working}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-600 dark:text-red-400">Öppna buggar</div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {stats.openBugs}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400">Fixade buggar</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.fixedBugs}
              </div>
            </div>
          </div>

          {/* Pages List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Sidor att testa ({stats.tested}/{stats.total})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pages.map(page => (
                <div
                  key={page.path}
                  className={`p-4 rounded-lg border-2 ${
                    page.tested
                      ? page.working
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{page.name}</h3>
                    {page.bugs > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {page.bugs}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {page.path}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(page.path)}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Öppna
                    </button>
                    <button
                      onClick={() => markPageTested(page.path, true)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      title="Markera som fungerande"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        markPageTested(page.path, false)
                        setSelectedPage(page.path)
                        setShowBugForm(true)
                      }}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      title="Markera som trasig"
                    >
                      ✗
                    </button>
                  </div>
                  {page.lastTested && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Testad: {new Date(page.lastTested).toLocaleString('sv-SE')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bugs Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Rapporterade buggar ({filteredBugs.length})
              </h2>
              <button
                onClick={() => setShowBugForm(!showBugForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Ny bugg
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Alla statusar</option>
                <option value="open">Öppna</option>
                <option value="fixed">Fixade</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Alla severiteter</option>
                <option value="low">Låg</option>
                <option value="medium">Medel</option>
                <option value="high">Hög</option>
                <option value="critical">Kritisk</option>
              </select>
            </div>

            {/* Bug Form */}
            {showBugForm && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Rapportera ny bugg</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sida *
                    </label>
                    <select
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Välj sida</option>
                      {pages.map(page => (
                        <option key={page.path} value={page.path}>
                          {page.name} ({page.path})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titel *
                    </label>
                    <input
                      type="text"
                      value={bugForm.title}
                      onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Kort beskrivning av buggen"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Beskrivning *
                    </label>
                    <textarea
                      value={bugForm.description}
                      onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Detaljerad beskrivning av buggen"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Severitet *
                    </label>
                    <select
                      value={bugForm.severity}
                      onChange={(e) => setBugForm({ ...bugForm, severity: e.target.value as Bug['severity'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Låg</option>
                      <option value="medium">Medel</option>
                      <option value="high">Hög</option>
                      <option value="critical">Kritisk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Steg för att reproducera
                    </label>
                    <textarea
                      value={bugForm.stepsToReproduce}
                      onChange={(e) => setBugForm({ ...bugForm, stepsToReproduce: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="1. Gå till sidan... 2. Klicka på..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Förväntat beteende
                    </label>
                    <textarea
                      value={bugForm.expectedBehavior}
                      onChange={(e) => setBugForm({ ...bugForm, expectedBehavior: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="Vad borde hända?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Faktiskt beteende
                    </label>
                    <textarea
                      value={bugForm.actualBehavior}
                      onChange={(e) => setBugForm({ ...bugForm, actualBehavior: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="Vad händer istället?"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addBug}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Spara bugg
                    </button>
                    <button
                      onClick={() => {
                        setShowBugForm(false)
                        setBugForm({
                          title: '',
                          description: '',
                          severity: 'medium',
                          stepsToReproduce: '',
                          expectedBehavior: '',
                          actualBehavior: '',
                        })
                        setSelectedPage('')
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bugs List */}
            <div className="space-y-4">
              {filteredBugs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Inga buggar hittades med valda filter
                </p>
              ) : (
                filteredBugs.map(bug => (
                  <div
                    key={bug.id}
                    className="p-4 border-2 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">{bug.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded border ${severityColors[bug.severity]}`}>
                            {bug.severity}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded border ${statusColors[bug.status]}`}>
                            {bug.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Sida:</strong> {bug.page}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{bug.description}</p>
                        {bug.stepsToReproduce && (
                          <div className="mt-2 text-sm">
                            <strong className="text-gray-700 dark:text-gray-300">Steg:</strong>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                              {bug.stepsToReproduce}
                            </p>
                          </div>
                        )}
                        {bug.expectedBehavior && (
                          <div className="mt-2 text-sm">
                            <strong className="text-green-700 dark:text-green-400">Förväntat:</strong>
                            <p className="text-gray-600 dark:text-gray-400">{bug.expectedBehavior}</p>
                          </div>
                        )}
                        {bug.actualBehavior && (
                          <div className="mt-2 text-sm">
                            <strong className="text-red-700 dark:text-red-400">Faktiskt:</strong>
                            <p className="text-gray-600 dark:text-gray-400">{bug.actualBehavior}</p>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Rapporterad: {new Date(bug.reportedAt).toLocaleString('sv-SE')}
                          {bug.fixedAt && (
                            <> • Fixad: {new Date(bug.fixedAt).toLocaleString('sv-SE')}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => router.push(bug.page)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Öppna sida
                      </button>
                      {bug.status === 'open' && (
                        <button
                          onClick={() => updateBugStatus(bug.id, 'in-progress')}
                          className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                          Pågående
                        </button>
                      )}
                      {bug.status !== 'fixed' && (
                        <button
                          onClick={() => updateBugStatus(bug.id, 'fixed')}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Markera som fixad
                        </button>
                      )}
                      {bug.status === 'fixed' && (
                        <button
                          onClick={() => updateBugStatus(bug.id, 'closed')}
                          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Stäng
                        </button>
                      )}
                      <button
                        onClick={() => deleteBug(bug.id)}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

