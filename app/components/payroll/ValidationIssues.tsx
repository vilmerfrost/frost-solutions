// app/components/payroll/ValidationIssues.tsx
'use client';

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight } from '@/lib/ui/icons';
import type { PayrollValidationIssue } from '@/types/payroll';

interface ValidationIssuesProps {
 issues: PayrollValidationIssue[];
}

export function ValidationIssues({ issues }: ValidationIssuesProps) {
 const [expandedErrors, setExpandedErrors] = useState(true);
 const [expandedWarnings, setExpandedWarnings] = useState(true);

 if (!issues || issues.length === 0) {
  return null;
 }

 const errors = issues.filter((i) => i.level === 'error');
 const warnings = issues.filter((i) => i.level === 'warning');

 return (
  <div className="space-y-4">
   {/* Errors */}
   {errors.length > 0 && (
    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-[8px] overflow-hidden">
     <button
      onClick={() => setExpandedErrors(!expandedErrors)}
      className="w-full flex items-center justify-between p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
     >
      <div className="flex items-center gap-3">
       <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
        <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
       </div>
       <div className="text-left">
        <h3 className="font-semibold text-red-900 dark:text-red-300">
         Fel ({errors.length})
        </h3>
        <p className="text-sm text-red-700 dark:text-red-400">
         Måste åtgärdas innan perioden kan låsas
        </p>
       </div>
      </div>
      {expandedErrors ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
     </button>

     {expandedErrors && (
      <div className="p-4 pt-0 space-y-3">
       {errors.map((issue, index) => (
        <IssueItem key={index} issue={issue} />
       ))}
      </div>
     )}
    </div>
   )}

   {/* Warnings */}
   {warnings.length > 0 && (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-[8px] overflow-hidden">
     <button
      onClick={() => setExpandedWarnings(!expandedWarnings)}
      className="w-full flex items-center justify-between p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
     >
      <div className="flex items-center gap-3">
       <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
        <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
       </div>
       <div className="text-left">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">
         Varningar ({warnings.length})
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
         Rekommenderas att åtgärda
        </p>
       </div>
      </div>
      {expandedWarnings ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
     </button>

     {expandedWarnings && (
      <div className="p-4 pt-0 space-y-3">
       {warnings.map((issue, index) => (
        <IssueItem key={index} issue={issue} />
       ))}
      </div>
     )}
    </div>
   )}
  </div>
 );
}

function IssueItem({ issue }: { issue: PayrollValidationIssue }) {
 const [showContext, setShowContext] = useState(false);

 return (
  <div className={`rounded-lg p-3 ${
   issue.level === 'error'
    ? 'bg-red-100 dark:bg-red-900/30'
    : 'bg-yellow-100 dark:bg-yellow-900/30'
  }`}>
   <div className="flex items-start gap-3">
    <div className="flex-1">
     <p className={`text-sm font-medium ${
      issue.level === 'error'
       ? 'text-red-900 dark:text-red-300'
       : 'text-yellow-900 dark:text-yellow-300'
     }`}>
      [{issue.code}] {issue.message}
     </p>

     {issue.context && Object.keys(issue.context).length > 0 && (
      <button
       onClick={() => setShowContext(!showContext)}
       className="text-xs text-gray-600 dark:text-gray-400 hover:underline mt-1"
      >
       {showContext ? 'Dölj' : 'Visa'} kontext
      </button>
     )}

     {showContext && issue.context && (
      <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-x-auto">
       {JSON.stringify(issue.context, null, 2)}
      </pre>
     )}
    </div>
   </div>
  </div>
 );
}

