'use client'

import { useState, useCallback } from 'react'

export type Industry = 'bygg' | 'vvs' | 'el' | 'maleri' | 'snickeri' | 'ovrigt'

export type OnboardingStep = 
  | 'welcome'
  | 'company'
  | 'profile'
  | 'demo-choice'
  | 'customer'
  | 'project'
  | 'success'

export interface OnboardingState {
  // Current step
  currentStep: OnboardingStep
  
  // Step 1: Welcome
  industry: Industry | null
  
  // Step 2: Company
  companyName: string
  orgNumber: string
  
  // Step 3: Profile
  adminName: string
  adminEmail: string
  adminBaseRate: string
  
  // Step 4: Demo choice
  useDemo: boolean | null
  
  // Step 5: Customer (if not demo)
  customerName: string
  customerEmail: string
  customerAddress: string
  customerOrgNumber: string
  
  // Step 6: Project (if not demo)
  projectName: string
  projectBudget: string
  projectRate: string
  projectSiteAddress: string
  
  // IDs created during onboarding
  tenantId: string | null
  clientId: string | null
  projectId: string | null
  
  // Loading states
  isLoading: boolean
  error: string | null
}

const initialState: OnboardingState = {
  currentStep: 'welcome',
  industry: null,
  companyName: '',
  orgNumber: '',
  adminName: '',
  adminEmail: '',
  adminBaseRate: '360',
  useDemo: null,
  customerName: '',
  customerEmail: '',
  customerAddress: '',
  customerOrgNumber: '',
  projectName: '',
  projectBudget: '',
  projectRate: '360',
  projectSiteAddress: '',
  tenantId: null,
  clientId: null,
  projectId: null,
  isLoading: false,
  error: null,
}

const stepOrder: OnboardingStep[] = [
  'welcome',
  'company',
  'profile',
  'demo-choice',
  'customer',
  'project',
  'success',
]

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
      
      // Handle demo flow - skip customer and project steps
      if (prev.currentStep === 'demo-choice' && prev.useDemo) {
        return { ...prev, currentStep: 'success', error: null }
      }
      
      if (currentIndex < stepOrder.length - 1) {
        return { ...prev, currentStep: stepOrder[currentIndex + 1], error: null }
      }
      return prev
    })
  }, [])
  
  const prevStep = useCallback(() => {
    setState(prev => {
      const currentIndex = stepOrder.indexOf(prev.currentStep)
      
      // Handle demo flow - go back to demo-choice from success if demo was selected
      if (prev.currentStep === 'success' && prev.useDemo) {
        return { ...prev, currentStep: 'demo-choice', error: null }
      }
      
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
    const { currentStep, useDemo } = state
    
    // Calculate visible step number based on flow
    if (currentStep === 'welcome') return 1
    if (currentStep === 'company') return 2
    if (currentStep === 'profile') return 3
    if (currentStep === 'demo-choice') return 4
    
    if (useDemo) {
      // Demo flow: 4 steps total
      if (currentStep === 'success') return 4
    } else {
      // Manual flow: 6 steps total
      if (currentStep === 'customer') return 5
      if (currentStep === 'project') return 6
      if (currentStep === 'success') return 6
    }
    
    return 1
  }, [state])
  
  const getTotalSteps = useCallback(() => {
    if (state.useDemo === null) return 4 // Before choice
    if (state.useDemo) return 4 // Demo path
    return 6 // Manual path
  }, [state.useDemo])
  
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

export type OnboardingActions = ReturnType<typeof useOnboardingState>
