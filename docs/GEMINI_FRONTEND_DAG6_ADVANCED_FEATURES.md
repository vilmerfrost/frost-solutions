# GEMINI 2.5 FRONTEND IMPLEMENTATION PROMPT - DAY 6 ADVANCED FEATURES

## 🎯 MISSION
Implementera frontend för **P0 (Priority 0) features** från backend-implementationen för Frost Solutions - en multi-tenant SaaS-plattform för byggprojekthantering.

**Stack:** Next.js 16 App Router + TypeScript + React Query v5 + Tailwind CSS + Sonner (toast)

---

## 📋 PRIORITET: P0 FEATURES (Implementera i denna ordning)

### 1. **RBAC & Permissions UI** (hooks + components)
### 2. **Advanced Search UI** (search bar + filters + results)
### 3. **Dashboard Analytics UI** (KPI cards + charts)

---

## 🏗️ EXISTING CODEBASE CONTEXT

### Nuvarande Patterns:
- **React Query:** `useQuery`, `useMutation`, `useQueryClient`
- **Hooks:** `@/hooks/useAdmin`, `@/hooks/useTenant`, `@/context/TenantContext`
- **UI Components:** Tailwind CSS, gradient designs, dark mode support
- **Toast:** `toast.success()`, `toast.error()` från `@/lib/toast`
- **Error Handling:** `extractErrorMessage()` från `@/lib/errorUtils`
- **API Calls:** Fetch till `/api/*` endpoints med JSON body

### Befintliga Komponenter:
- `SidebarClient` - Navigationssidebar
- `AIChatbot` - AI-assistent (flytande knapp)
- `NotificationCenter` - Notifikationscenter
- Gradient-knappar och cards med `bg-gradient-to-r from-blue-500 to-purple-500`

### Design System:
- **Colors:** Blue, Purple, Pink gradients
- **Spacing:** `p-4`, `p-6`, `gap-4`, `space-y-4`
- **Rounded:** `rounded-xl`, `rounded-2xl`
- **Shadows:** `shadow-lg`, `shadow-xl`
- **Dark Mode:** `dark:bg-gray-800`, `dark:text-white`

---

## 1️⃣ RBAC & PERMISSIONS - FRONTEND IMPLEMENTATION

### 1.1 React Query Hook för Permissions

**Skapa:** `app/hooks/usePermissions.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/supabaseClient';
import { useTenant } from '@/context/TenantContext';

export type Role = 'super_admin' | 'admin' | 'manager' | 'employee' | 'client';
export type Resource = 'projects' | 'invoices' | 'employees' | 'time_entries' | 'clients' | '*';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

interface Permission {
  resource: Resource;
  action: Action;
}

/**
 * Hook to get current user's role and permissions
 */
export function usePermissions() {
  const { tenantId } = useTenant();
  const supabase = createClient();

  return useQuery({
    queryKey: ['permissions', tenantId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !tenantId) {
        return { role: 'employee' as Role, permissions: [] as Permission[] };
      }

      const response = await fetch('/api/rbac/permissions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const result = await response.json();
      return {
        role: result.role as Role,
        permissions: result.permissions as Permission[],
      };
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to check if user can perform action on resource
 */
export function useCan(resource: Resource, action: Action) {
  const { data: permissionsData } = usePermissions();

  if (!permissionsData) {
    return { can: false, isLoading: true };
  }

  const { role, permissions } = permissionsData;

  // Super admin can do everything
  if (role === 'super_admin') {
    return { can: true, isLoading: false };
  }

  // Check if user has specific permission
  const hasPermission = permissions.some(
    (p) =>
      (p.resource === resource && p.action === action) ||
      (p.resource === '*' && p.action === 'manage')
  );

  return { can: hasPermission, isLoading: false };
}
```

### 1.2 Permission Guard Component

**Skapa:** `app/components/rbac/PermissionGuard.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { useCan, Resource, Action } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  resource: Resource;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders children if user has permission
 */
export function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can, isLoading } = useCan(resource, action);

  if (isLoading) {
    return <div className="animate-pulse">...</div>;
  }

  if (!can) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 1.3 RBAC API Route (för frontend)

**Skapa:** `app/api/rbac/permissions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserRole, getUserPermissions } from '@/lib/rbac/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const role = await getUserRole(user.id);
    const permissions = await getUserPermissions(user.id);

    return NextResponse.json({
      success: true,
      role,
      permissions,
    });
  } catch (error: any) {
    console.error('Permissions API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
```

### 1.4 Exempel: Använda PermissionGuard i Projects Page

**Uppdatera:** `app/projects/page.tsx` (eller relevant sida)

```typescript
import { PermissionGuard } from '@/components/rbac/PermissionGuard';

// I komponenten:
<PermissionGuard resource="projects" action="create">
  <button onClick={handleCreateProject}>
    Skapa nytt projekt
  </button>
</PermissionGuard>

<PermissionGuard resource="projects" action="delete">
  <button onClick={handleDelete} className="text-red-600">
    Ta bort
  </button>
</PermissionGuard>
```

---

## 2️⃣ ADVANCED SEARCH - FRONTEND IMPLEMENTATION

### 2.1 Search Hook

**Skapa:** `app/hooks/useSearch.ts`

```typescript
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';

interface SearchFilters {
  status?: string[];
  priority?: string[];
  dateRange?: [Date, Date];
  customerId?: string;
}

interface SearchResults {
  projects?: any[];
  clients?: any[];
  invoices?: any[];
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          filters: Object.fromEntries(
            Object.entries(filters).filter(([, v]) => v !== undefined && v !== null)
          ),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Search failed');
      }

      const result = await response.json();
      return result.data as SearchResults;
    },
    onError: (error: any) => {
      toast.error('Sökning misslyckades: ' + extractErrorMessage(error));
    },
  });

  return {
    query,
    setQuery,
    filters,
    setFilters,
    search: searchMutation.mutate,
    results: searchMutation.data,
    isSearching: searchMutation.isPending,
    error: searchMutation.error,
  };
}
```

### 2.2 Search Component

**Skapa:** `app/components/search/SearchBar.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/hooks/useSearch';

export function SearchBar() {
  const { query, setQuery, search, isSearching, results } = useSearch();
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Auto-search on debounced query change
  useCallback(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök projekt, kunder, fakturor..."
          className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Loading Indicator */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
            <span>Söker...</span>
          </div>
        </div>
      )}

      {/* Results */}
      {results && !isSearching && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
          {/* Projects */}
          {results.projects && results.projects.length > 0 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Projekt ({results.projects.length})
              </h3>
              <div className="space-y-2">
                {results.projects.map((project) => (
                  <a
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Status: {project.status}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {results.clients && results.clients.length > 0 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Kunder ({results.clients.length})
              </h3>
              <div className="space-y-2">
                {results.clients.map((client) => (
                  <a
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {client.name}
                    </div>
                    {client.org_number && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Org.nr: {client.org_number}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {results.invoices && results.invoices.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Fakturor ({results.invoices.length})
              </h3>
              <div className="space-y-2">
                {results.invoices.map((invoice) => (
                  <a
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {invoice.number || invoice.id.slice(0, 8)} - {invoice.customer_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {Number(invoice.amount || 0).toLocaleString('sv-SE')} kr
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {(!results.projects || results.projects.length === 0) &&
            (!results.clients || results.clients.length === 0) &&
            (!results.invoices || results.invoices.length === 0) && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Inga resultat hittades
              </div>
            )}
        </div>
      )}
    </div>
  );
}
```

### 2.3 useDebounce Hook (om den inte finns)

**Skapa:** `app/hooks/useDebounce.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 3️⃣ DASHBOARD ANALYTICS - FRONTEND IMPLEMENTATION

### 3.1 Analytics Hook

**Skapa:** `app/hooks/useDashboardAnalytics.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';

interface DashboardAnalytics {
  summary: {
    activeProjects: number;
    totalEmployees: number;
    totalHours: number;
    totalRevenue: number;
    unpaidInvoices: number;
    unpaidAmount: number;
  };
  kpis: {
    budgetVariance: number;
    utilization: number;
    unbilledHours: number;
  };
  projectPerformance: Array<{
    projectId: string;
    name: string;
    spi: number;
    status: string;
  }>;
  period: string;
}

export function useDashboardAnalytics(period: 'week' | 'month' | 'year' = 'month') {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ['dashboard-analytics', tenantId, period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/dashboard?period=${period}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard analytics');
      }

      const result = await response.json();
      return result.data as DashboardAnalytics;
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: true,
  });
}
```

### 3.2 Project Analytics Hook

**Skapa:** `app/hooks/useProjectAnalytics.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

interface ProjectAnalytics {
  project: {
    id: string;
    name: string;
    status: string;
  };
  metrics: {
    actualHours: number;
    plannedHours: number;
    actualCost: number;
    plannedValue: number;
    revenue: number;
  };
  kpis: {
    spi: number;
    cpi: number;
    budgetVariance: number;
    profitability: number;
  };
  status: {
    onSchedule: boolean;
    onBudget: boolean;
    profitable: boolean;
  };
}

export function useProjectAnalytics(projectId: string) {
  return useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/analytics`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project analytics');
      }

      const result = await response.json();
      return result.data as ProjectAnalytics;
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}
```

### 3.3 Dashboard Analytics Component

**Skapa:** `app/components/analytics/DashboardAnalytics.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Clock, Users, FileText } from 'lucide-react';

export function DashboardAnalytics() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: analytics, isLoading, error } = useDashboardAnalytics(period);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">
          Kunde inte ladda analytics: {error?.message || 'Okänt fel'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              period === p
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            {p === 'week' ? 'Vecka' : p === 'month' ? 'Månad' : 'År'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Aktiva projekt"
          value={analytics.summary.activeProjects}
          icon={FileText}
          color="blue"
        />
        <KPICard
          title="Anställda"
          value={analytics.summary.totalEmployees}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Totala timmar"
          value={analytics.summary.totalHours.toFixed(1)}
          icon={Clock}
          color="green"
        />
        <KPICard
          title="Omsättning"
          value={`${analytics.summary.totalRevenue.toLocaleString('sv-SE')} kr`}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Obetalda fakturor"
          value={analytics.summary.unpaidInvoices}
          icon={FileText}
          color="red"
          subtitle={`${analytics.summary.unpaidAmount.toLocaleString('sv-SE')} kr`}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Budgetvarians"
          value={`${analytics.kpis.budgetVariance > 0 ? '+' : ''}${analytics.kpis.budgetVariance.toFixed(1)}%`}
          icon={analytics.kpis.budgetVariance >= 0 ? TrendingUp : TrendingDown}
          color={analytics.kpis.budgetVariance >= 0 ? 'green' : 'red'}
        />
        <KPICard
          title="Utnyttjande"
          value={`${(analytics.kpis.utilization * 100).toFixed(1)}%`}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title="Ofakturerade timmar"
          value={analytics.kpis.unbilledHours.toFixed(1)}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Project Performance */}
      {analytics.projectPerformance.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Projektprestanda
          </h3>
          <div className="space-y-2">
            {analytics.projectPerformance.map((project) => (
              <div
                key={project.projectId}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Status: {project.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    SPI: {project.spi.toFixed(2)}
                  </div>
                  <div
                    className={`text-xs ${
                      project.spi >= 0.95 ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {project.spi >= 0.95 ? 'På schema' : 'Försenad'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: 'blue' | 'purple' | 'green' | 'red' | 'yellow';
  subtitle?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
```

### 3.4 Project Analytics Component

**Skapa:** `app/components/analytics/ProjectAnalytics.tsx`

```typescript
'use client';

import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ProjectAnalyticsProps {
  projectId: string;
}

export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const { data: analytics, isLoading, error } = useProjectAnalytics(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">
          Kunde inte ladda projektanalys: {error?.message || 'Okänt fel'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Schema"
          status={analytics.status.onSchedule}
          value={`SPI: ${analytics.kpis.spi.toFixed(2)}`}
        />
        <StatusCard
          title="Budget"
          status={analytics.status.onBudget}
          value={`${analytics.kpis.budgetVariance > 0 ? '+' : ''}${analytics.kpis.budgetVariance.toFixed(1)}%`}
        />
        <StatusCard
          title="Lönsamhet"
          status={analytics.status.profitable}
          value={`${analytics.kpis.profitability.toFixed(1)}%`}
        />
      </div>

      {/* Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricItem label="Faktiska timmar" value={analytics.metrics.actualHours.toFixed(1)} />
          <MetricItem label="Planerade timmar" value={analytics.metrics.plannedHours.toFixed(1)} />
          <MetricItem
            label="Faktisk kostnad"
            value={`${analytics.metrics.actualCost.toLocaleString('sv-SE')} kr`}
          />
          <MetricItem
            label="Planerat värde"
            value={`${analytics.metrics.plannedValue.toLocaleString('sv-SE')} kr`}
          />
          <MetricItem
            label="Intäkter"
            value={`${analytics.metrics.revenue.toLocaleString('sv-SE')} kr`}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Schedule Performance Index (SPI)</h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.kpis.spi.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {analytics.kpis.spi >= 0.95 ? 'På schema' : 'Försenad'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cost Performance Index (CPI)</h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics.kpis.cpi.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {analytics.kpis.cpi >= 0.95 ? 'På budget' : 'Över budget'}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  status,
  value,
}: {
  title: string;
  status: boolean;
  value: string;
}) {
  return (
    <div
      className={`p-4 rounded-xl border-2 ${
        status
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        {status ? (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}
```

---

## ✅ ACCEPTANCE CRITERIA

### RBAC:
- [ ] `usePermissions()` hook returnerar korrekt role och permissions
- [ ] `PermissionGuard` döljer/visar komponenter baserat på permissions
- [ ] RBAC API route fungerar och returnerar korrekt data
- [ ] Exempel-implementation i minst 1 sida (t.ex. projects page)

### Advanced Search:
- [ ] `SearchBar` komponent visar sökresultat i dropdown
- [ ] Sökning fungerar med svenska tecken (å/ä/ö)
- [ ] Results är klickbara och länkar till rätt sida
- [ ] Loading state och error handling fungerar

### Dashboard Analytics:
- [ ] `DashboardAnalytics` visar alla KPIs korrekt
- [ ] Period selector (week/month/year) fungerar
- [ ] `ProjectAnalytics` visar projekt-specifika metrics
- [ ] Status indicators (onSchedule, onBudget, profitable) fungerar
- [ ] Alla värden formateras korrekt (SEK, decimaler)

---

## 📝 IMPLEMENTATION NOTES

1. **React Query:** Använd `staleTime` för caching, `enabled` för conditional fetching
2. **Error Handling:** Alltid visa användarvänliga felmeddelanden
3. **Loading States:** Visa loading spinners under data-fetching
4. **Dark Mode:** Alla komponenter måste stödja dark mode
5. **Responsive:** Alla komponenter måste fungera på mobil
6. **TypeScript:** Använd strikta typer, inga `any` om möjligt
7. **Accessibility:** Lägg till `aria-label` på ikoner och knappar

---

## 🚀 START IMPLEMENTATION

**Steg 1:** Skapa RBAC hooks och API route
**Steg 2:** Skapa `PermissionGuard` komponent
**Steg 3:** Integrera RBAC i minst 1 sida (t.ex. projects)
**Steg 4:** Skapa Search hooks och `SearchBar` komponent
**Steg 5:** Lägg till `SearchBar` i header/sidebar
**Steg 6:** Skapa Analytics hooks
**Steg 7:** Skapa `DashboardAnalytics` och `ProjectAnalytics` komponenter
**Steg 8:** Integrera Analytics i dashboard och projekt-sidor
**Steg 9:** Testa allt och fixa bugs

**Lycka till! 🎯**

