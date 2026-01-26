'use client';

import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { MobileVerificationCard, type VerificationField } from './MobileVerificationCard';
import { GloveFriendlyButton } from '../GloveFriendlyButton';
import { MobileCard } from '../MobileCard';

interface MobileVerificationFlowProps {
  fields: VerificationField[];
  onComplete: (verifiedFields: VerificationField[]) => void;
  onCancel: () => void;
  title?: string;
}

/**
 * MobileVerificationFlow - Field-First Design System
 * 
 * Step-through verification flow for OCR-extracted invoice fields:
 * - Shows ONE field at a time as a MobileVerificationCard
 * - Field sequence: Supplier → Invoice Number → Date → Amount → Due Date
 * - Progress dots at top
 * - Navigation: Back/Next with auto-advance on confirm
 */
export function MobileVerificationFlow({
  fields,
  onComplete,
  onCancel,
  title = 'Verifiera fakturadata',
}: MobileVerificationFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [verifiedFields, setVerifiedFields] = useState<VerificationField[]>(fields);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const currentField = verifiedFields[currentIndex];
  const isFirstField = currentIndex === 0;
  const isLastField = currentIndex === verifiedFields.length - 1;
  const allConfirmed = confirmedIds.size === verifiedFields.length;

  const handleConfirm = (id: string) => {
    setConfirmedIds(prev => new Set([...prev, id]));
    
    // Auto-advance to next field, or show summary if last
    if (!isLastField) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    }
  };

  const handleEdit = (id: string, newValue: string) => {
    setVerifiedFields(prev =>
      prev.map(f => (f.id === id ? { ...f, value: newValue, confidence: 'high' as const } : f))
    );
    // Mark as confirmed after edit
    handleConfirm(id);
  };

  const handleNext = () => {
    if (isLastField) {
      // Show summary or complete
      if (allConfirmed) {
        onComplete(verifiedFields);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (isFirstField) {
      onCancel();
    } else {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Summary view when all fields confirmed and on last field
  if (isLastField && allConfirmed) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-900 dark:border-gray-100 p-4 safe-area-pt">
          <h1 className="field-text-xl text-center">Sammanfattning</h1>
        </header>

        {/* Summary content */}
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Alla fält har verifierats
          </p>

          <MobileCard className="mb-4">
            <div className="space-y-4">
              {verifiedFields.map(field => (
                <div key={field.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{field.label}</span>
                  <span className="font-bold text-right">{field.value}</span>
                </div>
              ))}
            </div>
          </MobileCard>
        </main>

        {/* Actions */}
        <footer className="field-action-zone">
          <div className="flex gap-4">
            <GloveFriendlyButton
              variant="secondary"
              onClick={() => setCurrentIndex(0)}
            >
              Granska igen
            </GloveFriendlyButton>
            <GloveFriendlyButton
              variant="success"
              onClick={() => onComplete(verifiedFields)}
              icon={FileText}
            >
              Spara faktura
            </GloveFriendlyButton>
          </div>
        </footer>
      </div>
    );
  }

  // Field-by-field verification view
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-900 dark:border-gray-100 p-4 safe-area-pt">
        <div className="flex items-center justify-between mb-4">
          <h1 className="field-text-xl">{title}</h1>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} av {verifiedFields.length}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {verifiedFields.map((field, index) => {
            const isConfirmed = confirmedIds.has(field.id);
            const isCurrent = index === currentIndex;
            
            let dotClass = 'field-progress-dot';
            if (isConfirmed) {
              dotClass = 'field-progress-dot-completed';
            } else if (isCurrent) {
              dotClass = 'field-progress-dot-active';
            }
            
            return (
              <button
                key={field.id}
                onClick={() => setCurrentIndex(index)}
                className={`${dotClass} transition-colors`}
                aria-label={`Gå till ${field.label}`}
              />
            );
          })}
        </div>
      </header>

      {/* Current field */}
      <main className="flex-1 p-4 flex items-start justify-center overflow-y-auto">
        <div className="w-full max-w-md">
          <MobileVerificationCard
            field={currentField}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
          />

          {confirmedIds.has(currentField.id) && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Bekräftad</span>
            </div>
          )}
        </div>
      </main>

      {/* Navigation */}
      <footer className="field-action-zone">
        <div className="flex gap-4">
          <GloveFriendlyButton
            variant="secondary"
            onClick={handleBack}
            icon={ChevronLeft}
            fullWidth={false}
            className="flex-1"
          >
            {isFirstField ? 'Avbryt' : 'Tillbaka'}
          </GloveFriendlyButton>

          {!isLastField && (
            <GloveFriendlyButton
              variant="primary"
              onClick={handleNext}
              icon={ChevronRight}
              iconPosition="right"
              fullWidth={false}
              className="flex-1"
            >
              Hoppa över
            </GloveFriendlyButton>
          )}

          {isLastField && !allConfirmed && (
            <GloveFriendlyButton
              variant="warning"
              onClick={() => {
                // Confirm remaining fields and complete
                const remaining = verifiedFields.filter(f => !confirmedIds.has(f.id));
                remaining.forEach(f => setConfirmedIds(prev => new Set([...prev, f.id])));
              }}
            >
              Bekräfta återstående
            </GloveFriendlyButton>
          )}
        </div>
      </footer>
    </div>
  );
}

export default MobileVerificationFlow;
