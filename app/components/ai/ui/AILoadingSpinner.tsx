export function AILoadingSpinner({ text = 'Analyserar med AI...' }: { text?: string }) {
 return (
  <div className="flex items-center gap-3 p-4 justify-center">
   <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
   <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
  </div>
 );
}

