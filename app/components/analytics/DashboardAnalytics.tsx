'use client';

import { useState, useEffect } from 'react';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Clock, Users, FileText, LucideIcon } from 'lucide-react';

/**
 * En återanvändbar KPI-kortkomponent
 */
function KPICard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl">
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

/**
 * Huvudkomponenten för dashboard-analys
 */
export function DashboardAnalytics() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: analytics, isLoading, error, refetch } = useDashboardAnalytics(period);
  const queryClient = useQueryClient();

  // Listen for data updates and refetch analytics
  useEffect(() => {
    const handleProjectUpdate = () => {
      console.log('🔄 DashboardAnalytics: Project updated, refetching...');
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      refetch();
    };

    const handleTimeEntryUpdate = () => {
      console.log('🔄 DashboardAnalytics: Time entry updated, refetching...');
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      refetch();
    };

    const handleInvoiceUpdate = () => {
      console.log('🔄 DashboardAnalytics: Invoice updated, refetching...');
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      refetch();
    };

    window.addEventListener('projectCreated', handleProjectUpdate);
    window.addEventListener('projectUpdated', handleProjectUpdate);
    window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate);
    window.addEventListener('invoiceCreated', handleInvoiceUpdate);
    window.addEventListener('invoiceUpdated', handleInvoiceUpdate);

    return () => {
      window.removeEventListener('projectCreated', handleProjectUpdate);
      window.removeEventListener('projectUpdated', handleProjectUpdate);
      window.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate);
      window.removeEventListener('invoiceCreated', handleInvoiceUpdate);
      window.removeEventListener('invoiceUpdated', handleInvoiceUpdate);
    };
  }, [queryClient, refetch]);

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
      {/* Periodväljare */}
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

      {/* Sammanfattningskort */}
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
          color="yellow"
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
        <KPICard
          title="Utnyttjande"
          value={`${(analytics.kpis.utilization * 100).toFixed(1)}%`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Projektprestanda */}
      {analytics.projectPerformance.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Projektprestanda
          </h3>
          <div className="space-y-3">
            {analytics.projectPerformance.map((project) => (
              <a
                key={project.projectId}
                href={`/projects/${project.projectId}`}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                    className={`text-xs font-medium ${
                      project.spi >= 0.95 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    {project.spi >= 0.95 ? 'På schema' : 'Försenad'}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

