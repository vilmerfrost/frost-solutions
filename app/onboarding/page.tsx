'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import { BASE_PATH } from '@/utils/url'
import { apiFetch } from '@/lib/http/fetcher'

// Components
import { StepIndicator } from './components/StepIndicator'
import { WelcomeStep } from './components/WelcomeStep'
import { CompanyStep } from './components/CompanyStep'
import { ProfileStep } from './components/ProfileStep'
import { DemoChoiceStep } from './components/DemoChoiceStep'
import { CustomerStep } from './components/CustomerStep'
import { ProjectStep } from './components/ProjectStep'
import { SuccessStep } from './components/SuccessStep'

// Hooks & animations
import { useOnboardingState, Industry } from './hooks/useOnboardingState'
import { pageVariants, stepGradients } from './animations/variants'

export default function OnboardingPage() {
  const router = useRouter()
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

  // Pre-fill admin info from auth
  useEffect(() => {
    async function prefillFromAuth() {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const email = userData.user.email || ''
        const fullName = userData.user.user_metadata?.full_name || 
          userData.user.email?.split('@')[0] || ''
        
        updateState({
          adminEmail: email,
          adminName: fullName.charAt(0).toUpperCase() + fullName.slice(1),
        })
      }
    }
    prefillFromAuth()
  }, [updateState])

  // Step handlers
  const handleWelcomeContinue = useCallback(() => {
    if (!state.industry) {
      setError('Välj en bransch för att fortsätta')
      return
    }
    nextStep()
  }, [state.industry, nextStep, setError])

  const handleCompanyContinue = useCallback(async () => {
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
        const result = await apiFetch<{ tenantId?: string; tenant_id?: string; employeeId?: string }>('/api/onboarding/create-tenant', {
          method: 'POST',
          body: JSON.stringify({
            name: state.companyName,
            orgNumber: state.orgNumber || null,
            userId: userId,
            industry: state.industry,
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
      } else {
        // Update existing tenant
        // @ts-expect-error - Supabase types are strict but this is valid
        await supabase.from('tenants').update({ name: state.companyName }).eq('id', currentTenantId)
        
        updateState({ tenantId: currentTenantId })
      }

      nextStep()
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }, [state, tenantId, nextStep, setLoading, setError, updateState, setTenantId])

  const handleProfileContinue = useCallback(async () => {
    if (!state.adminName.trim()) {
      setError('Ditt namn krävs')
      return
    }

    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      const currentTenantId = state.tenantId || tenantId

      if (!currentTenantId || !userId) {
        setError('Ingen tenant hittad')
        return
      }

      await apiFetch('/api/onboarding/update-admin', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: currentTenantId,
          userId: userId,
          fullName: state.adminName,
          email: state.adminEmail || null,
          baseRate: Number(state.adminBaseRate) || 360,
        }),
      })

      nextStep()
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }, [state, tenantId, nextStep, setLoading, setError])

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

      toast.success('Demo-data skapad!')
      nextStep()
    } catch (err: any) {
      setError(err.message || 'Kunde inte skapa demo-data')
      updateState({ useDemo: null })
    } finally {
      setLoading(false)
    }
  }, [state.tenantId, tenantId, nextStep, setLoading, setError, updateState])

  const handleChooseScratch = useCallback(() => {
    updateState({ useDemo: false })
    nextStep()
  }, [nextStep, updateState])

  const handleCustomerContinue = useCallback(async () => {
    if (!state.customerName.trim()) {
      setError('Kundnamn krävs')
      return
    }

    setLoading(true)
    try {
      const currentTenantId = state.tenantId || tenantId

      if (!currentTenantId) {
        setError('Ingen tenant hittad')
        return
      }

      const result = await apiFetch<{ clientId?: string }>('/api/onboarding/create-client', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: currentTenantId,
          name: state.customerName,
          email: state.customerEmail || null,
          address: state.customerAddress || null,
          orgNumber: state.customerOrgNumber || null,
          clientType: state.customerOrgNumber ? 'company' : 'private',
        }),
      })

      if (result.clientId) {
        updateState({ clientId: result.clientId })
      }

      nextStep()
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }, [state, tenantId, nextStep, setLoading, setError, updateState])

  const handleProjectContinue = useCallback(async () => {
    if (!state.projectName.trim()) {
      setError('Projektnamn krävs')
      return
    }

    setLoading(true)
    try {
      const currentTenantId = state.tenantId || tenantId

      if (!currentTenantId) {
        setError('Ingen tenant hittad')
        return
      }

      // Small delay to ensure client is saved
      await new Promise(resolve => setTimeout(resolve, 500))

      const result = await apiFetch<{ projectId?: string }>('/api/onboarding/create-project', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: currentTenantId,
          name: state.projectName,
          clientId: state.clientId || null,
          baseRate: Number(state.projectRate) || 360,
          budgetedHours: state.projectBudget ? Number(state.projectBudget) : null,
          siteAddress: state.projectSiteAddress || null,
        }),
      })

      if (result.projectId) {
        updateState({ projectId: result.projectId })
      }

      toast.success('Projekt skapat!')
      nextStep()
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }, [state, tenantId, nextStep, setLoading, setError, updateState])

  // Success handlers
  const handleGoToDashboard = useCallback(() => {
    toast.success('Välkommen till Frost Solutions!')
    window.location.href = `${BASE_PATH}/`
  }, [])

  const handleReportTime = useCallback(() => {
    localStorage.setItem('onboarding-show-time-tip', 'true')
    window.location.href = `${BASE_PATH}/reports/new`
  }, [])

  const handleCreateInvoice = useCallback(() => {
    window.location.href = `${BASE_PATH}/invoices/new`
  }, [])

  const handleStartTour = useCallback(() => {
    localStorage.removeItem('onboarding-tour-completed')
    window.location.href = `${BASE_PATH}/`
  }, [])

  // Get current gradient
  const currentGradient = stepGradients[state.currentStep] || stepGradients.welcome

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentGradient} transition-all duration-700`}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Step Indicator */}
        {state.currentStep !== 'success' && (
          <StepIndicator
            currentStep={getStepNumber()}
            totalSteps={getTotalSteps()}
          />
        )}

        {/* Content */}
        <div className="w-full max-w-2xl">
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
                  selectedIndustry={state.industry}
                  onSelect={(industry: Industry) => updateState({ industry })}
                  onContinue={handleWelcomeContinue}
                  actions={{ state, updateState, nextStep, prevStep, setLoading, setError, getStepNumber, getTotalSteps, setStep: () => {} }}
                />
              )}

              {state.currentStep === 'company' && (
                <CompanyStep
                  companyName={state.companyName}
                  orgNumber={state.orgNumber}
                  onCompanyNameChange={(value) => updateState({ companyName: value })}
                  onOrgNumberChange={(value) => updateState({ orgNumber: value })}
                  onContinue={handleCompanyContinue}
                  onBack={prevStep}
                  isLoading={state.isLoading}
                  error={state.error}
                />
              )}

              {state.currentStep === 'profile' && (
                <ProfileStep
                  adminName={state.adminName}
                  adminEmail={state.adminEmail}
                  adminBaseRate={state.adminBaseRate}
                  onAdminNameChange={(value) => updateState({ adminName: value })}
                  onAdminEmailChange={(value) => updateState({ adminEmail: value })}
                  onAdminBaseRateChange={(value) => updateState({ adminBaseRate: value })}
                  onContinue={handleProfileContinue}
                  onBack={prevStep}
                  isLoading={state.isLoading}
                  error={state.error}
                />
              )}

              {state.currentStep === 'demo-choice' && (
                <DemoChoiceStep
                  onChooseDemo={handleChooseDemo}
                  onChooseScratch={handleChooseScratch}
                  onBack={prevStep}
                  isLoading={state.isLoading}
                />
              )}

              {state.currentStep === 'customer' && (
                <CustomerStep
                  customerName={state.customerName}
                  customerEmail={state.customerEmail}
                  customerAddress={state.customerAddress}
                  customerOrgNumber={state.customerOrgNumber}
                  onCustomerNameChange={(value) => updateState({ customerName: value })}
                  onCustomerEmailChange={(value) => updateState({ customerEmail: value })}
                  onCustomerAddressChange={(value) => updateState({ customerAddress: value })}
                  onCustomerOrgNumberChange={(value) => updateState({ customerOrgNumber: value })}
                  onContinue={handleCustomerContinue}
                  onBack={prevStep}
                  isLoading={state.isLoading}
                  error={state.error}
                />
              )}

              {state.currentStep === 'project' && (
                <ProjectStep
                  projectName={state.projectName}
                  projectSiteAddress={state.projectSiteAddress}
                  projectBudget={state.projectBudget}
                  projectRate={state.projectRate}
                  onProjectNameChange={(value) => updateState({ projectName: value })}
                  onProjectSiteAddressChange={(value) => updateState({ projectSiteAddress: value })}
                  onProjectBudgetChange={(value) => updateState({ projectBudget: value })}
                  onProjectRateChange={(value) => updateState({ projectRate: value })}
                  onContinue={handleProjectContinue}
                  onBack={prevStep}
                  isLoading={state.isLoading}
                  error={state.error}
                />
              )}

              {state.currentStep === 'success' && (
                <SuccessStep
                  onGoToDashboard={handleGoToDashboard}
                  onReportTime={handleReportTime}
                  onCreateInvoice={handleCreateInvoice}
                  onStartTour={handleStartTour}
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
