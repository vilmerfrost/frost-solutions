'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride'

const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="text-center py-2">
        <h3 className="text-lg font-semibold mb-2">Välkommen till Frost Solutions!</h3>
        <p className="text-gray-600">
          Låt oss visa dig runt i systemet så att du snabbt kommer igång. 
          Du kan hoppa över turen när som helst.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard-stats"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Dashboard</h3>
        <p className="text-sm text-gray-600">
          Här ser du dina nyckeltal i realtid - projekt, timmar, fakturor och mer.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="time-clock"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Stämpelklocka</h3>
        <p className="text-sm text-gray-600">
          Klicka för att starta eller stoppa tidrapportering. Välj projekt och OB-typ direkt.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-projects"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Projekt</h3>
        <p className="text-sm text-gray-600">
          Hantera alla dina projekt här. Skapa nya, se budget och tidrapporter.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-invoices"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Fakturor</h3>
        <p className="text-sm text-gray-600">
          Skapa och skicka fakturor. Du kan även använda AI för att läsa in leverantörsfakturor.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="ai-chatbot"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">AI-Assistent</h3>
        <p className="text-sm text-gray-600">
          Klicka på AI-ikonen för att få hjälp med allt från fakturering till rapporter. 
          Leta efter sparkle-ikonen!
        </p>
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '[data-tour="quick-search"]',
    content: (
      <div>
        <h3 className="font-semibold mb-1">Snabbsök</h3>
        <p className="text-sm text-gray-600">
          Tryck "/" var som helst för att snabbt söka efter projekt, kunder eller fakturor.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div className="text-center py-2">
        <h3 className="text-lg font-semibold mb-2">Det var allt!</h3>
        <p className="text-gray-600">
          Nu är du redo att börja använda Frost Solutions. 
          Om du har frågor, klicka på AI-assistenten eller kontakta oss via Feedback.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

interface OnboardingTourProps {
  run?: boolean
  onComplete?: () => void
}

export function OnboardingTour({ run: externalRun, onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    // Check if we should auto-start the tour
    if (externalRun !== undefined) {
      setRun(externalRun)
    } else {
      const hasSeenTour = localStorage.getItem('onboarding-tour-completed')
      if (!hasSeenTour) {
        // Show tour after a brief delay to let the page load
        setTimeout(() => setRun(true), 1500)
      }
    }
  }, [externalRun])

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data

    // Handle step changes
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1))
    }

    // Handle tour completion or skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false)
      localStorage.setItem('onboarding-tour-completed', 'true')
      onComplete?.()
    }
  }, [onComplete])

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton={false}
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      steps={tourSteps}
      styles={{
        options: {
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          primaryColor: 'var(--primary-500, #007AFF)',
          textColor: '#1f2937',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 16,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
        },
        tooltipContent: {
          padding: '8px 0',
        },
        buttonNext: {
          backgroundColor: 'var(--primary-500, #007AFF)',
          borderRadius: 8,
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 8,
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: 13,
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
      locale={{
        back: 'Tillbaka',
        close: 'Stäng',
        last: 'Klar!',
        next: 'Nästa',
        skip: 'Hoppa över',
      }}
    />
  )
}

// Hook to restart the tour from anywhere
export function useRestartTour() {
  return () => {
    localStorage.removeItem('onboarding-tour-completed')
    window.location.reload()
  }
}

// Hook to start tour programmatically
export function useTourControl() {
  const [shouldRun, setShouldRun] = useState(false)
  
  const startTour = useCallback(() => {
    localStorage.removeItem('onboarding-tour-completed')
    setShouldRun(true)
  }, [])
  
  const stopTour = useCallback(() => {
    setShouldRun(false)
  }, [])
  
  return { shouldRun, startTour, stopTour }
}
