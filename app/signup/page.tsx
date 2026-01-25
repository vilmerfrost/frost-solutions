'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import FrostLogo from '../components/FrostLogo'

export default function SignupPage() {
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [fullName, setFullName] = useState('')
 const [companyName, setCompanyName] = useState('')
 const [orgNumber, setOrgNumber] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')
 
 const router = useRouter()
 
 const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  // Validate password length
  if (password.length < 8) {
   setError('Lösenordet måste vara minst 8 tecken.')
   setLoading(false)
   return
  }

  // Validate company name
  if (!companyName.trim()) {
   setError('Företagsnamn krävs.')
   setLoading(false)
   return
  }
  
  try {
   // 1. Create auth user
   const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
     data: {
      full_name: fullName,
      company_name: companyName,
      org_number: orgNumber || null,
     },
    }
   })
   
   if (authError) throw authError
   
   if (!authData.user) {
    throw new Error('Kunde inte skapa användare')
   }

   // 2. Immediately sign them in
   const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
   })
   
   if (signInError) throw signInError
   
   // 3. Create profile with trial start date via API (bypasses RLS)
   const trialEnds = new Date()
   trialEnds.setDate(trialEnds.getDate() + 30) // 30 days trial
   
   const profileRes = await fetch('/api/auth/create-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     userId: authData.user.id,
     fullName: fullName,
     email: email,
     companyName: companyName,
     orgNumber: orgNumber || null,
     trialStartedAt: new Date().toISOString(),
     trialEndsAt: trialEnds.toISOString(),
     subscriptionStatus: 'trial'
    })
   })

   if (!profileRes.ok) {
    // Profile creation is optional - user can still proceed
    console.warn('Could not create profile, continuing to onboarding')
   }
   
   // 4. Redirect to onboarding
   router.push('/onboarding')
   
  } catch (err: any) {
   console.error('Signup error:', err)
   // Handle common Supabase errors
   if (err.message?.includes('already registered')) {
    setError('Den här e-postadressen är redan registrerad. Testa att logga in istället.')
   } else if (err.message?.includes('Password')) {
    setError('Lösenordet måste vara minst 8 tecken.')
   } else {
    setError(err.message || 'Något gick fel vid registreringen')
   }
   setLoading(false)
  }
 }
 
 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
   <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-10">
    {/* Header */}
    <div className="flex flex-col items-center mb-6">
     <FrostLogo size={56} />
     <h1 className="font-semibold text-2xl sm:text-3xl mt-4 mb-2 text-gray-900 dark:text-white">
      Kom igång med Frost
     </h1>
     <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
      30 dagars gratis provperiod. Inget betalkort krävs.
     </p>
    </div>
    
    {/* Error Message */}
    {error && (
     <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
      {error}
     </div>
    )}
    
    {/* Signup Form */}
    <form onSubmit={handleSignup} className="space-y-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
       Fullständigt namn *
      </label>
      <input
       type="text"
       value={fullName}
       onChange={(e) => setFullName(e.target.value)}
       required
       className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
       placeholder="Anna Andersson"
      />
     </div>
     
     <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
       E-postadress *
      </label>
      <input
       type="email"
       value={email}
       onChange={(e) => setEmail(e.target.value)}
       required
       className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
       placeholder="anna@foretag.se"
      />
     </div>
     
     <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
       Lösenord *
      </label>
      <input
       type="password"
       value={password}
       onChange={(e) => setPassword(e.target.value)}
       required
       minLength={8}
       className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
       placeholder="Minst 8 tecken"
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
       Företagsnamn *
      </label>
      <input
       type="text"
       value={companyName}
       onChange={(e) => setCompanyName(e.target.value)}
       required
       className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
       placeholder="Bygg AB"
      />
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
       Organisationsnummer <span className="text-gray-400 dark:text-gray-500 font-normal">(valfritt)</span>
      </label>
      <input
       type="text"
       value={orgNumber}
       onChange={(e) => setOrgNumber(e.target.value)}
       className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
       placeholder="556123-4567"
      />
     </div>
     
     <button
      type="submit"
      disabled={loading}
      className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
     >
      {loading ? 'Skapar konto...' : 'Skapa gratis konto'}
     </button>
    </form>
    
    {/* Login Link */}
    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
     Har du redan ett konto?{' '}
     <a href="/login" className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors">
      Logga in
     </a>
    </p>
    
    {/* Trial Benefits */}
    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
     <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1">
       <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
       </svg>
       30 dagar gratis
      </span>
      <span className="flex items-center gap-1">
       <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
       </svg>
       Ingen bindningstid
      </span>
      <span className="flex items-center gap-1">
       <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
       </svg>
       Inget betalkort
      </span>
     </div>
    </div>

    {/* Footer */}
    <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
     © 2026 Frost Apps
    </div>
   </div>
  </div>
 )
}
