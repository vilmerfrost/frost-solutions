// app/components/integrations/IntegrationWarning.tsx
"use client";

import { Info, AlertTriangle } from 'lucide-react';

interface IntegrationWarningProps {
 variant: 'info' | 'error';
 title: string;
 children: React.ReactNode;
}

export function IntegrationWarning({ variant, title, children }: IntegrationWarningProps) {
 const isError = variant === 'error';

 const config = {
  icon: isError ? AlertTriangle : Info,
  iconColor: isError ? 'text-red-500' : 'text-blue-500',
  bgColor: isError ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20',
  borderColor: isError ? 'border-red-200 dark:border-red-700' : 'border-blue-200 dark:border-blue-700',
  titleColor: isError ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200',
  textColor: isError ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300',
 };

 const Icon = config.icon;

 return (
  <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
   <div className="flex items-start gap-3">
    <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
    <div>
     <h3 className={`font-semibold ${config.titleColor}`}>{title}</h3>
     <div className={`mt-1 text-sm ${config.textColor}`}>
      {children}
     </div>
    </div>
   </div>
  </div>
 );
}

