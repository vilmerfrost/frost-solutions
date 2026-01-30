'use client'

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import { BASE_PATH } from '@/utils/url'
import { apiFetch } from '@/lib/http/fetcher'

// Components
import { StepIndicator } from './components/StepIndicator'
import { WelcomeStep } from './components/WelcomeStep'
import { SetupStep } from './components/SetupStep'
import { SuccessStep } from './components/SuccessStep'

// Hooks & animations
import { useOnboardingState } from './hooks/useOnboardingState'
import { pageVariants } from './animations/variants'

export default function OnboardingPage() {
  const { tenantId, setTenantId } = useTenant()
  const {
    state,
    updateState,
    nextStep,
    prevStep,
    setLoading,
    setError,
    getStepNumber,
    getTotalSteps,
  } = useOnboardingState()

  // Step 1: Welcome - Create tenant with company name
  const handleWelcomeContinue = useCallback(async () => {
    if (!state.companyName.trim()) {
      setError('Företagsnamn krävs')
      return
    }

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      if (!userId) {
        setError('Du är inte inloggad')
        return
      }

      let currentTenantId = tenantId || state.tenantId

      if (!currentTenantId) {
        // Create new tenant
        const result = await apiFetch<{ tenantId?: string; tenant_id?: string }>('/api/onboarding/create-tenant', {
          method: 'POST',
          body: JSON.stringify({
            name: state.companyName,
            userId: userId,
          }),
        })

        const newTenantId = result.tenantId || result.tenant_id
        if (!newTenantId) {
          throw new Error('Kunde inte skapa företag')
        }

        currentTenantId = newTenantId
        updateState({ tenantId: newTenantId })

        // Set tenant in metadata
        await apiFetch('/api/auth/set-tenant', {
          method: 'POST',
          body: JSON.stringify({ tenantId: currentTenantId, userId }),
        })

        setTenantId(currentTenantId)
      }

      nextStep()
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }, [state.companyName, state.tenantId, tenantId, nextStep, setLoading, setError, updateState, setTenantId])

  // Step 2: Setup - Choose demo or empty
  const handleChooseDemo = useCallback(async () => {
    setLoading(true)
    updateState({ useDemo: true })

    try {
      const currentTenantId = state.tenantId || tenantId
      const { data: userData } = await supabase.auth.getUser()

      if (!currentTenantId) {
        setError('Ingen tenant hittad')
        return
      }

      await apiFetch('/api/onboarding/seed-demo-data', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: currentTenantId,
          userId: userData?.user?.id,
        }),
      })

      nextStep()
    } catch (err: any) {
      setError(err.message || 'Kunde inte skapa demo-data')
      updateState({ useDemo: null })
    } finally {
      setLoading(false)
    }
  }, [state.tenantId, tenantId, nextStep, setLoading, setError, updateState])

  const handleChooseEmpty = useCallback(() => {
    updateState({ useDemo: false })
    nextStep()
  }, [nextStep, updateState])

  // Step 3: Success - Go to dashboard
  const handleGoToDashboard = useCallback(() => {
    toast.success('Välkommen till Frost!')
    window.location.href = `${BASE_PATH}/dashboard`
  }, [])

  // Background gradient based on step
  const gradients: Record<string, string> = {
    welcome: 'from-blue-600 via-blue-500 to-cyan-500',
    setup: 'from-cyan-500 via-teal-500 to-emerald-500',
    success: 'from-emerald-500 via-green-500 to-teal-500',
  }
  const currentGradient = gradients[state.currentStep] || gradients.welcome

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentGradient} transition-all duration-500`}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Step Indicator */}
        {state.currentStep !== 'success' && (
          <StepIndicator
            currentStep={getStepNumber()}
            totalSteps={getTotalSteps()}
          />
        )}

        {/* Content */}
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {state.currentStep === 'welcome' && (
                <WelcomeStep
                  companyName={state.companyName}
                  onCompanyNameChange={(value) => updateState({ companyName: value })}
                  onContinue={handleWelcomeContinue}
                  isLoading={state.isLoading}
                  error={state.error}
                />
              )}

              {state.currentStep === 'setup' && (
                <SetupStep
                  onChooseDemo={handleChooseDemo}
                  onChooseEmpty={handleChooseEmpty}
                  onBack={prevStep}
                  isLoading={state.isLoading}
                />
              )}

              {state.currentStep === 'success' && (
                <SuccessStep
                  onGoToDashboard={handleGoToDashboard}
                  usedDemo={state.useDemo === true}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
