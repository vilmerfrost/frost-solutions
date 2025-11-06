'use client';

import { useState, useEffect } from 'react';
import { useAIKMA } from '@/hooks/useAIKMA';
import type { KmaItem } from '@/types/ai';
import { AICard } from './ui/AICard';
import { AIBadge } from './ui/AIBadge';
import { AILoadingSpinner } from './ui/AILoadingSpinner';
import { AIActionButton } from './ui/AIActionButton';
import { Camera, Check, Edit, Zap } from 'lucide-react';
import { toast } from '@/lib/toast';

interface KmaItemWithEnabled extends KmaItem {
  enabled: boolean;
}

export function KMAIISuggestion({ projectType }: { projectType: string }) {
  const [items, setItems] = useState<KmaItemWithEnabled[]>([]);
  const kmaMutation = useAIKMA();

  useEffect(() => {
    // Hämta förslag automatiskt vid laddning
    kmaMutation.mutate(projectType, {
      onSuccess: (data) => {
        setItems(data.items.map((item) => ({ ...item, enabled: true })));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectType]);

  const handleToggleItem = (index: number) => {
    setItems((currentItems) =>
      currentItems.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleCreateChecklist = () => {
    const enabledItems = items.filter((item) => item.enabled);
    console.log('Skapar checklista med:', enabledItems);
    toast.success(`${enabledItems.length} punkter lades till i KMA-planen.`);
  };

  return (
    <AICard>
      <AIBadge text="AI Checklista (KMA)" />

      {kmaMutation.isPending && <AILoadingSpinner text="Genererar checklista..." />}

      {kmaMutation.isError && (
        <div className="text-center py-4 text-red-500">
          Kunde inte hämta förslag.
          <AIActionButton
            variant="secondary"
            onClick={() => kmaMutation.mutate(projectType)}
            className="mt-2"
          >
            Försök igen
          </AIActionButton>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI har genererat en checklista baserat på projekttyp: &quot;{projectType}&quot;. Välj de
            punkter du vill inkludera.
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {items.map((item, index) => (
              <label
                key={index}
                className={`flex items-center p-3 rounded-lg border transition-colors ${
                  item.enabled
                    ? 'border-purple-300 bg-white dark:bg-gray-800'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={() => handleToggleItem(index)}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                  {item.title}
                </span>
                {item.requiresPhoto && (
                  <Camera className="w-4 h-4 text-gray-500 ml-2" title="Foto krävs" />
                )}
              </label>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AIActionButton onClick={handleCreateChecklist} icon={Check}>
              Använd valda ({items.filter((item) => item.enabled).length})
            </AIActionButton>
            <AIActionButton variant="secondary" icon={Edit}>
              Redigera
            </AIActionButton>
          </div>
        </div>
      )}
    </AICard>
  );
}

