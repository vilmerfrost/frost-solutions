// app/components/onboarding/OnboardingTour.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/button'

/**
 * Interactive Onboarding Tour Component
 * 
 * Note: This is a placeholder implementation. To use the full-featured tour with spotlight effects,
 * install react-joyride: npm install react-joyride
 * 
 * For now, this shows a simple welcome modal on first visit.
 */

interface TourStep {
  title: string
  description: string
  target?: string
}

const tourSteps: TourStep[] = [
  {
    title: 'Välkommen till Frost Solutions!',
    description: 'Låt oss visa dig runt i systemet. Du kan hoppa över turen när som helst.',
  },
  {
    title: 'Dashboard',
    description: 'Här ser du en översikt över dina nyckeltal, projekt och aktiviteter.',
    target: '.dashboard-overview',
  },
  {
    title: 'Navigation',
    description: 'Använd sidomenyn för att navigera mellan olika sektioner. På mobil hittar du den viktigaste navigationen i botten.',
    target: '.sidebar-nav',
  },
  {
    title: 'Snabbåtgärder',
    description: 'Använd snabbåtgärderna för att snabbt rapportera tid, skapa fakturor och starta projekt.',
    target: '.quick-actions',
  },
  {
    title: 'Tidsrapportering',
    description: 'Rapportera din tid enkelt med OB-typ-väljaren. Allt sparas automatiskt.',
    target: '.time-tracking',
  },
  {
    title: 'AI-funktioner',
    description: 'Vi använder AI för att hjälpa dig med fakturaskanning, ROT-avdrag och mer. Leta efter ✨-ikonen!',
    target: '.ai-features',
  },
  {
    title: 'Sök',
    description: 'Tryck "/" för att snabbt söka efter projekt, kunder eller fakturor.',
    target: '.search-bar',
  },
  {
    title: 'Inställningar',
    description: 'Anpassa utseende, integrationer och mer under inställningar.',
    target: '.settings-link',
  },
]

export function OnboardingTour() {
  const [showTour, setShowTour] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('onboarding-tour-completed')
    if (!hasSeenTour) {
      // Show tour after a brief delay to let the page load
      setTimeout(() => setShowTour(true), 1000)
    }
  }, [])

  const completeTour = () => {
    localStorage.setItem('onboarding-tour-completed', 'true')
    setShowTour(false)
  }

  const skipTour = () => {
    completeTour()
  }

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!showTour) return null

  const step = tourSteps[currentStep]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Tour Card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-[12px] shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 fade-in duration-200">
        {/* Close Button */}
        <button
          onClick={skipTour}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
          aria-label="Close tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Steg {currentStep + 1} av {tourSteps.length}
          </p>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <Button variant="secondary" onClick={prevStep}>
              Tillbaka
            </Button>
          ) : (
            <button
              onClick={skipTour}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Hoppa över turen
            </button>
          )}
          <Button variant="primary" onClick={nextStep}>
            {currentStep === tourSteps.length - 1 ? 'Kom igång!' : 'Nästa'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook to restart the tour from anywhere
export function useRestartTour() {
  return () => {
    localStorage.removeItem('onboarding-tour-completed')
    window.location.reload()
  }
}

