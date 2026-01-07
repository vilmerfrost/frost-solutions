// app/components/ai/AIBalanceWidget.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';
import { Wallet, RefreshCw, Plus } from '@/lib/ui/icons';

interface AIBalanceProps {
  onTopUp?: () => void;
  showTopUpButton?: boolean;
  compact?: boolean;
}

export function AIBalanceWidget({ 
  onTopUp, 
  showTopUpButton = true,
  compact = false 
}: AIBalanceProps) {
  const { tenantId } = useTenant();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ai-balance', tenantId],
    queryFn: async () => {
      const response = await fetch('/api/ai/balance', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch balance');
      const json = await response.json();
      return json.data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className={`animate-pulse ${compact ? 'h-8 w-24' : 'h-16 w-40'} bg-gray-200 dark:bg-gray-700 rounded-lg`} />
    );
  }

  const balance = data?.balance ?? 0;
  const isLow = balance < 10;
  const isEmpty = balance <= 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
          ${isEmpty 
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
            : isLow 
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }
        `}>
          <Wallet size={14} />
          <span>{balance.toFixed(0)} kr</span>
        </div>
        {showTopUpButton && onTopUp && (
          <button
            onClick={onTopUp}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Ladda på"
          >
            <Plus size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`
      p-4 rounded-xl border-2 transition-all
      ${isEmpty 
        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
        : isLow 
          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }
    `}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Wallet size={16} />
            <span>AI-krediter</span>
          </div>
          <div className={`text-2xl font-bold ${
            isEmpty 
              ? 'text-red-600 dark:text-red-400' 
              : isLow 
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-900 dark:text-white'
          }`}>
            {balance.toFixed(2)} kr
          </div>
          {isEmpty && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Ladda på för att använda AI-funktioner
            </p>
          )}
          {isLow && !isEmpty && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Lågt saldo - ladda på snart
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Uppdatera"
          >
            <RefreshCw 
              size={16} 
              className={`text-gray-500 ${isRefetching ? 'animate-spin' : ''}`} 
            />
          </button>
          {showTopUpButton && onTopUp && (
            <button
              onClick={onTopUp}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${isEmpty || isLow
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }
              `}
            >
              Ladda på
            </button>
          )}
        </div>
      </div>

      {data?.totalSpent > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Totalt spenderat:</span>
            <span>{data.totalSpent.toFixed(2)} kr</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIBalanceWidget;

