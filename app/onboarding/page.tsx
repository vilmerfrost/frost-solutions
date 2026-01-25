'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import FrostLogo from '@/components/FrostLogo'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import { BASE_PATH } from '@/utils/url'
import { CSVUploader } from '@/components/import/CSVUploader'
import { Upload, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
 const router = useRouter()
 const { tenantId, setTenantId } = useTenant()
 const [step, setStep] = useState(1)
 const [loading, setLoading] = useState(false)
 const [finalTenantId, setFinalTenantId] = useState<string | null>(tenantId) // Store tenant ID from step 1
 
 // Step 1: Company info
 const [companyName, setCompanyName] = useState('')
 const [orgNumber, setOrgNumber] = useState('')
 
 // Step 2: Admin user info
 const [adminName, setAdminName] = useState('')
 const [adminEmail, setAdminEmail] = useState('')
 const [adminBaseRate, setAdminBaseRate] = useState('360')
 
 // Step 3: First customer
 const [customerName, setCustomerName] = useState('')
 const [customerEmail, setCustomerEmail] = useState('')
 const [customerAddress, setCustomerAddress] = useState('')
 const [customerOrgNumber, setCustomerOrgNumber] = useState('')
 const [clientId, setClientId] = useState<string | null>(null) // Store client ID from step 3
 
 // Step 4: First project
 const [projectName, setProjectName] = useState('')
 const [projectBudget, setProjectBudget] = useState('')
 const [projectRate, setProjectRate] = useState('360')

 async function handleStep1() {
  if (!companyName.trim()) {
   toast.error('Företagsnamn krävs')
   return
  }
  
  setLoading(true)
  try {
   const { data: userData } = await supabase.auth.getUser()
   const userId = userData?.user?.id

   if (!userId) {
    toast.error('Du är inte inloggad')
    setLoading(false)
    return
   }

   // Update or create tenant
   let currentTenantId = tenantId || finalTenantId
   
   if (!currentTenantId) {
    // Create new tenant via API route (bypasses RLS)
    const createTenantRes = await fetch('/api/onboarding/create-tenant', {
     method: 'POST',
     headers: { 'content-type': 'application/json' },
     body: JSON.stringify({
      name: companyName,
      orgNumber: orgNumber || null,
      userId: userId,
     }),
    })

    if (!createTenantRes.ok) {
     const errorData = await createTenantRes.json().catch(() => ({}))
     throw new Error(errorData.error || 'Kunde inte skapa tenant')
    }

    const resultData = await createTenantRes.json()
    const newTenantId = resultData.tenantId || resultData.tenant_id
    
    if (!newTenantId) {
     console.error('Create tenant response:', resultData)
     throw new Error('Kunde inte skapa tenant - inget tenant ID returnerades. Response: ' + JSON.stringify(resultData))
    }
    
    currentTenantId = newTenantId
    setFinalTenantId(newTenantId) // Store in state for step 2
    const employeeId = resultData.employeeId || null
    
    if (!employeeId) {
     console.warn('Employee record was not created during tenant creation')
     // Don't show error toast - dashboard will auto-create it as fallback
     // toast.error('Varning: Kunde inte skapa anställd-record automatiskt. Du kan behöva skapa den manuellt.')
    } else {
     console.log('Employee record created successfully:', employeeId)
    }

    // CRITICAL: Set tenant in user metadata and cookie immediately
    try {
     const setTenantRes = await fetch('/api/auth/set-tenant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
       tenantId: currentTenantId,
       userId: userId
      }),
     })
     
     if (!setTenantRes.ok) {
      const errorData = await setTenantRes.json().catch(() => ({}))
      console.error('Failed to set tenant:', errorData)
      throw new Error('Kunde inte sätta tenant: ' + (errorData.error || 'Okänt fel'))
     }
     
     // Update TenantContext immediately
     setTenantId(currentTenantId)
    } catch (err: any) {
     console.error('Failed to set tenant in metadata:', err)
     toast.error('Varning: Kunde inte sätta tenant korrekt. Försök logga in igen.')
     throw err
    }
   } else {
    // Update existing tenant - try with org_number first, fallback without it
    const updatePayload: any = { name: companyName }
    if (orgNumber && orgNumber.trim()) {
     updatePayload.org_number = orgNumber.trim()
    }
    
    const updateResult = await (supabase
     .from('tenants') as any)
     .update(updatePayload)
     .eq('id', currentTenantId)
    
    if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('org_number'))) {
     // org_number column doesn't exist, try without it
     await (supabase
      .from('tenants') as any)
      .update({ name: companyName })
      .eq('id', currentTenantId)
    }
    
    setFinalTenantId(currentTenantId) // Store in state for step 2
   }

    // Tenant will be synced via TenantContext
    
   // Pre-fill admin email from current user (userData is already defined above)
   if (userData?.user?.email) {
    setAdminEmail(userData.user.email)
   }
   if (userData?.user?.user_metadata?.full_name) {
    setAdminName(userData.user.user_metadata.full_name)
   } else if (userData?.user?.email) {
    // Extract name from email
    const emailName = userData.user.email.split('@')[0]
    setAdminName(emailName.charAt(0).toUpperCase() + emailName.slice(1))
   }
    
   setStep(2)
  } catch (err: any) {
   toast.error('Fel: ' + err.message)
  } finally {
   setLoading(false)
  }
 }

 async function handleStep2() {
  if (!adminName.trim()) {
   toast.error('Admin-namn krävs')
   return
  }
  
  setLoading(true)
  try {
   const { data: userData } = await supabase.auth.getUser()
   const userId = userData?.user?.id

   if (!userId) {
    toast.error('Du är inte inloggad')
    setLoading(false)
    return
   }

   // Use finalTenantId from step 1 (state), or fallback to tenantId from context
   const currentTenantId = finalTenantId || tenantId
   
   if (!currentTenantId) {
    toast.error('Ingen tenant hittad. Gå tillbaka till steg 1 och skapa företag först.')
    setLoading(false)
    return
   }

   // Update admin employee record via API route (bypasses RLS)
   const updateAdminRes = await fetch('/api/onboarding/update-admin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
     tenantId: currentTenantId,
     userId: userId,
     fullName: adminName,
     email: adminEmail || null,
     baseRate: Number(adminBaseRate) || 360,
    }),
   })

   if (!updateAdminRes.ok) {
    const errorData = await updateAdminRes.json().catch(() => ({}))
    console.error('Update admin error:', errorData)
    throw new Error(errorData.error || 'Kunde inte uppdatera admin-användare')
   }

   const adminResult = await updateAdminRes.json()
   console.log('Admin employee updated/created:', adminResult)

   setStep(3)
  } catch (err: any) {
   console.error('Error in handleStep2:', err)
   toast.error('Fel: ' + err.message)
  } finally {
   setLoading(false)
  }
 }

 async function handleStep3() {
  if (!customerName.trim()) {
   toast.error('Kundnamn krävs')
   return
  }
  
  setLoading(true)
  try {
   // Use finalTenantId from step 1 (state), or fallback to tenantId from context
   const currentTenantId = finalTenantId || tenantId
   
   if (!currentTenantId) {
    toast.error('Ingen tenant hittad. Gå tillbaka till steg 1 och skapa företag först.')
    setLoading(false)
    return
   }

   console.log('Creating client with tenantId:', currentTenantId)
   console.log('finalTenantId from state:', finalTenantId)
   console.log('tenantId from context:', tenantId)

   // Create customer via API route (bypasses RLS)
   const createClientRes = await fetch('/api/onboarding/create-client', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
     tenantId: currentTenantId, // Use the tenant ID from step 1
     name: customerName,
     email: customerEmail || null,
     address: customerAddress || null,
     orgNumber: customerOrgNumber || null,
     clientType: 'company', // Default to company for onboarding
    }),
   })

   if (!createClientRes.ok) {
    const errorData = await createClientRes.json().catch(() => ({}))
    console.error('Create client error:', errorData)
    throw new Error(errorData.error || 'Kunde inte skapa kund')
   }

   const clientResult = await createClientRes.json()
   if (clientResult.clientId) {
    setClientId(clientResult.clientId)
    console.log('Client created with ID:', clientResult.clientId)
   }

   setStep(4)
  } catch (err: any) {
   console.error('Error in handleStep3:', err)
   toast.error('Fel: ' + err.message)
  } finally {
   setLoading(false)
  }
 }

 async function handleStep4() {
  if (!projectName.trim()) {
   toast.error('Projektnamn krävs')
   return
  }
  
  setLoading(true)
  try {
   // Use finalTenantId from step 1 (state), or fallback to tenantId from context
   const currentTenantId = finalTenantId || tenantId
   
   if (!currentTenantId) {
    toast.error('Ingen tenant hittad. Gå tillbaka till steg 1 och skapa företag först.')
    setLoading(false)
    return
   }

   console.log('Creating project with tenantId:', currentTenantId)
   console.log('Client ID from step 3:', clientId)
   console.log('finalTenantId from state:', finalTenantId)
   console.log('tenantId from context:', tenantId)

   // Note: We don't verify tenant from frontend because RLS might block it
   // The API route (which uses service role) will handle verification

   // Add a longer delay between client creation and project creation
   // This ensures all database transactions are fully committed
   // Increased delay to handle potential read replica lag or connection pool issues
   await new Promise(resolve => setTimeout(resolve, 1000))

   // Create project via API route (bypasses RLS)
   const createProjectRes = await fetch('/api/onboarding/create-project', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
     tenantId: currentTenantId,
     name: projectName,
     clientId: clientId || null, // Use client ID from step 2 if available
     baseRate: Number(projectRate) || 360,
     budgetedHours: projectBudget ? Number(projectBudget) : null,
    }),
   })

   if (!createProjectRes.ok) {
    const errorData = await createProjectRes.json().catch(() => ({}))
    console.error('Create project error:', errorData)
    throw new Error(errorData.error || 'Kunde inte skapa projekt')
   }

   // Move to optional import step
   setStep(5)
   toast.success('Projekt skapat!')
  } catch (err: any) {
   console.error('Error in handleStep4:', err)
   toast.error('Fel: ' + err.message)
  } finally {
   setLoading(false)
  }
 }

 function finishOnboarding() {
  toast.success('Onboarding klar!')
  toast.info('💡 Viktigt: Logga ut och in igen för att se tidsrapporter och stämpelklockan.')
  
  // Wait a moment for toasts to show, then redirect
  setTimeout(() => {
   window.location.href = `${BASE_PATH}/dashboard`
  }, 2000)
 }

 return (
  <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
   <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 lg:p-10">
    <div className="flex flex-col items-center mb-8">
     <FrostLogo size={64} />
     <h1 className="font-semibold text-4xl mt-4 mb-2 text-gray-900 dark:text-white dark:bg-clip-text dark:text-white">
      Välkommen till Frost Solutions!
     </h1>
     <p className="text-gray-600 dark:text-gray-300">Låt oss sätta upp ditt konto</p>
    </div>

    {/* Progress */}
    <div className="mb-8">
     <div className="flex justify-between mb-2">
      {[1, 2, 3, 4, 5].map((s) => (
       <div
        key={s}
        className={`flex-1 h-2 rounded-full mx-0.5 ${
         s <= step ? 'bg-primary-500' : 'bg-gray-200'
        }`}
       />
      ))}
     </div>
     <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>Företag</span>
      <span>Admin</span>
      <span>Kund</span>
      <span>Projekt</span>
      <span>Import</span>
     </div>
    </div>

    {/* Step 1: Company */}
    {step === 1 && (
     <div className="space-y-6">
      {/* Plan Info Card */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 text-white shadow-lg mb-6">
       <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🎉</span>
        <h2 className="text-2xl font-bold">1 Månad Gratis!</h2>
       </div>
       <p className="text-white/90 mb-4">
        Få full tillgång till <strong>Allt-i-Ett</strong> planen helt gratis i 30 dagar. 
        Ingen betalning krävs nu!
       </p>
       <div className="bg-white/20 rounded-lg p-4">
        <div className="text-sm text-white/80 mb-2">Därefter:</div>
        <div className="text-3xl font-bold mb-3">499 kr/månad</div>
        <ul className="space-y-2 text-sm">
         <li className="flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Obegränsade projekt & anställda
         </li>
         <li className="flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          ROT/RUT-avdrag
         </li>
         <li className="flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Fortnox & Visma integration
         </li>
         <li className="flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          AI-funktioner & OCR
         </li>
        </ul>
       </div>
       <p className="text-xs text-white/70 mt-4">
        💡 Du kan säga upp när som helst. Ingen bindningstid.
       </p>
      </div>

      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Företagsnamn *
       </label>
       <input
        type="text"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="Frost Solutions AB"
       />
      </div>
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Organisationsnummer
       </label>
       <input
        type="text"
        value={orgNumber}
        onChange={(e) => setOrgNumber(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="556677-8899"
       />
      </div>
      <button
       onClick={handleStep1}
       disabled={loading}
       className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50"
      >
       {loading ? 'Sparar...' : 'Fortsätt →'}
      </button>
     </div>
    )}

    {/* Step 2: Admin User */}
    {step === 2 && (
     <div className="space-y-6">
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Ditt namn (Admin) *
       </label>
       <input
        type="text"
        value={adminName}
        onChange={(e) => setAdminName(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="Anna Andersson"
       />
      </div>
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        E-post
       </label>
       <input
        type="email"
        value={adminEmail}
        onChange={(e) => setAdminEmail(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="anna@exempel.se"
       />
      </div>
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Grundlön per timme (SEK)
       </label>
       <input
        type="number"
        value={adminBaseRate}
        onChange={(e) => setAdminBaseRate(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="360"
       />
      </div>
      <div className="flex gap-4">
       <button
        onClick={() => setStep(1)}
        className="flex-1 px-6 py-4 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
       >
        ← Tillbaka
       </button>
       <button
        onClick={handleStep2}
        disabled={loading}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50"
       >
        {loading ? 'Sparar...' : 'Fortsätt →'}
       </button>
      </div>
     </div>
    )}

    {/* Step 3: Customer */}
    {step === 3 && (
     <div className="space-y-6">
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Kundnamn *
       </label>
       <input
        type="text"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="Kundens företag"
       />
      </div>
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        E-post
       </label>
       <input
        type="email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="kund@exempel.se"
       />
      </div>
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Adress
       </label>
       <input
        type="text"
        value={customerAddress}
        onChange={(e) => setCustomerAddress(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="Gatuadress 1, 123 45 Stad"
       />
      </div>
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Organisationsnummer <span className="text-xs text-gray-400 dark:text-gray-500">(valfritt - endast för företag)</span>
       </label>
       <input
        type="text"
        value={customerOrgNumber}
        onChange={(e) => setCustomerOrgNumber(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="556677-8899 (lämna tomt för privatkund)"
       />
       <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        Privata kunder behöver inget org.nr. Org.nr sparas i projektet om det anges.
       </p>
      </div>
      <div className="flex gap-4">
       <button
        onClick={() => setStep(2)}
        className="flex-1 px-6 py-4 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
       >
        ← Tillbaka
       </button>
       <button
        onClick={handleStep3}
        disabled={loading}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50"
       >
        {loading ? 'Sparar...' : 'Fortsätt →'}
       </button>
      </div>
     </div>
    )}

    {/* Step 4: Project */}
    {step === 4 && (
     <div className="space-y-6">
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Projektnamn *
       </label>
       <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="Altanbygge, Köksrenovering..."
       />
      </div>
      <div className="grid grid-cols-2 gap-4">
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Budget (timmar)
        </label>
        <input
         type="number"
         value={projectBudget}
         onChange={(e) => setProjectBudget(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
         placeholder="100"
        />
       </div>
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Timpris (SEK)
        </label>
        <input
         type="number"
         value={projectRate}
         onChange={(e) => setProjectRate(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
         placeholder="360"
        />
       </div>
      </div>
      <div className="flex gap-4">
       <button
        onClick={() => setStep(3)}
        className="flex-1 px-6 py-4 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
       >
        ← Tillbaka
       </button>
       <button
        onClick={handleStep4}
        disabled={loading}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50"
       >
        {loading ? 'Sparar...' : 'Fortsätt →'}
       </button>
      </div>
     </div>
    )}

    {/* Step 5: Optional Import from Bygglet */}
    {step === 5 && (
     <div className="space-y-6">
      <div className="text-center mb-6">
       <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
        <Upload className="w-8 h-8 text-primary-500" />
       </div>
       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Importera från Bygglet (valfritt)
       </h2>
       <p className="text-gray-600 dark:text-gray-400">
        Har du data från Bygglet eller liknande system? Importera det här för att komma igång snabbare.
       </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
       <h3 className="font-medium text-gray-900 dark:text-white mb-2">💡 Tips för import</h3>
       <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <li>• Importera i ordning: Kunder → Anställda → Projekt → Tidsrapporter</li>
        <li>• CSV-filer ska vara i UTF-8 format</li>
        <li>• Du kan importera mer data senare under Inställningar → Import</li>
       </ul>
      </div>

      <CSVUploader onImportComplete={(result) => {
       if (result.success) {
        toast.success(`${result.imported} poster importerades!`)
       }
      }} />

      <div className="flex gap-4 mt-8">
       <button
        onClick={() => setStep(4)}
        className="flex-1 px-6 py-4 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
       >
        ← Tillbaka
       </button>
       <button
        onClick={finishOnboarding}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
       >
        Slutför & Gå till Dashboard
        <ArrowRight className="w-5 h-5" />
       </button>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
       Du kan alltid importera mer data senare via Inställningar → Import
      </p>
     </div>
    )}
   </div>
  </div>
 )
}
