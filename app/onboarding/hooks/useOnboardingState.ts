'use client'

import { useState, useCallback } from 'react'

export type OnboardingStep = 'welcome' | 'setup' | 'success'

export interface OnboardingState {
  currentStep: OnboardingStep
  companyName: string
  useDemo: boolean | null
  tenantId: string | null
  isLoading: boolean
  error: string | null
}

const initialState: OnboardingState = {
  currentStep: 'welcome',
  companyName: '',
  useDemo: null,
  tenantId: null,
  isLoading: false,
  error: null,
}

const stepOrder: OnboardingStep[] = ['welcome', 'setup', 'success']

export function useOnboardingState() {
  const [state, setState] = useState<OnboardingState>(initialState)
  
  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])
  
  const setStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }))
  }, [])
  
  const nextStep = useCallback(() => {
    setState(prev => {
      const currentIndex = stepOrder.indexOf(prev.currentStep)
      if (currentIndex < stepOrder.length - 1) {
        return { ...prev, currentStep: stepOrder[currentIndex + 1], error: null }
      }
      return prev
    })
  }, [])
  
  const prevStep = useCallback(() => {
    setState(prev => {
      const currentIndex = stepOrder.indexOf(prev.currentStep)
      if (currentIndex > 0) {
        return { ...prev, currentStep: stepOrder[currentIndex - 1], error: null }
      }
      return prev
    })
  }, [])
  
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])
  
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }))
  }, [])
  
  const getStepNumber = useCallback(() => {
    return stepOrder.indexOf(state.currentStep) + 1
  }, [state.currentStep])
  
  const getTotalSteps = useCallback(() => {
    return 3
  }, [])
  
  return {
    state,
    updateState,
    setStep,
    nextStep,
    prevStep,
    setLoading,
    setError,
    getStepNumber,
    getTotalSteps,
  }
}
