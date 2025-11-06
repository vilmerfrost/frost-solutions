import { Database } from 'lucide-react';

export function CachedBadge() {
  return (
    <span
      title="Detta resultat hämtades från cache"
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
    >
      <Database className="w-3 h-3" />
      Cache
    </span>
  );
}

