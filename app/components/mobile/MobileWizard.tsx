'use client';

import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { GloveFriendlyButton } from './GloveFriendlyButton';

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  component: React.ReactNode;
  isValid?: boolean;
}

export interface MobileWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onCancel?: () => void;
  title?: string;
  completeLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

/**
 * MobileWizard - Field-First Design System
 * 
 * Multi-step wizard container optimized for mobile field workers.
 * 
 * Features:
 * - Progress dots (not numbers) for simple visual tracking
 * - Fixed bottom navigation (Back/Next)
 * - Step validation before advancing
 * - Large touch targets throughout
 * - No swipe gestures required
 */
export function MobileWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  title,
  completeLabel = 'Slutför',
  nextLabel = 'Nästa',
  backLabel = 'Tillbaka',
  cancelLabel = 'Avbryt',
  isLoading = false,
}: MobileWizardProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];
  const canProceed = currentStepData?.isValid !== false;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (isFirstStep && onCancel) {
      onCancel();
    } else if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-900 dark:border-gray-100 p-4 safe-area-pt">
        {/* Title and close button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="field-text-xl">{title || currentStepData?.title}</h1>
          {onCancel && isFirstStep && (
            <button
              onClick={onCancel}
              className="touch-target-48 px-4 text-gray-600 dark:text-gray-400 font-semibold"
            >
              {cancelLabel}
            </button>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => {
            let dotClass = 'field-progress-dot';
            if (index < currentStep) {
              dotClass = 'field-progress-dot-completed';
            } else if (index === currentStep) {
              dotClass = 'field-progress-dot-active';
            }
            return (
              <div
                key={step.id}
                className={dotClass}
                aria-label={`Steg ${index + 1}: ${step.title}${index < currentStep ? ' (klart)' : index === currentStep ? ' (pågående)' : ''}`}
              />
            );
          })}
        </div>

        {/* Step subtitle */}
        {currentStepData?.subtitle && (
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            {currentStepData.subtitle}
          </p>
        )}
      </header>

      {/* Step content */}
      <main className="flex-1 overflow-y-auto">
        <div className="field-wizard-step p-4">
          {currentStepData?.component}
        </div>
      </main>

      {/* Fixed bottom navigation */}
      <footer className="field-action-zone">
        <div className="flex gap-4">
          {/* Back button - only show if not first step, or if onCancel is provided */}
          {(!isFirstStep || onCancel) && (
            <GloveFriendlyButton
              variant="secondary"
              onClick={handleBack}
              icon={isFirstStep ? undefined : ArrowLeft}
              fullWidth={false}
              className="flex-1"
            >
              {isFirstStep ? cancelLabel : backLabel}
            </GloveFriendlyButton>
          )}

          {/* Next/Complete button */}
          <GloveFriendlyButton
            variant={isLastStep ? 'success' : 'primary'}
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            icon={isLastStep ? Check : undefined}
            iconPosition="right"
            fullWidth={!(!isFirstStep || onCancel)}
            className={!isFirstStep || onCancel ? 'flex-1' : 'w-full'}
          >
            {isLoading ? 'Laddar...' : isLastStep ? completeLabel : nextLabel}
          </GloveFriendlyButton>
        </div>
      </footer>
    </div>
  );
}

/**
 * MobileWizardStep - Individual step container (optional wrapper)
 */
export function MobileWizardStep({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex-1 ${className}`}>{children}</div>;
}

export default MobileWizard;
