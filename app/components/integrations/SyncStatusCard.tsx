// app/components/integrations/SyncStatusCard.tsx

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';

interface SyncStats {
  total: number;
  success: number;
  error: number;
  pending: number;
}

interface SyncStatusCardProps {
  stats: SyncStats;
  isLoading?: boolean;
}

export function SyncStatusCard({ stats, isLoading }: SyncStatusCardProps) {
  const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
  const errorRate = stats.total > 0 ? (stats.error / stats.total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
          <Activity size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Synkroniseringsstatus
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Senaste 50 operationerna
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Totalt
            </span>
            <Activity size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {stats.total}
          </div>
        </div>

        {/* Success */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Lyckade
            </span>
            <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {stats.success}
            </div>
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              {successRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Error */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Misslyckade
            </span>
            <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">
              {stats.error}
            </div>
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              {errorRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Väntande
            </span>
            <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
            {stats.pending}
          </div>
        </div>
      </div>
    </div>
  );
}

