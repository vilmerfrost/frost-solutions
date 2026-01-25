'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { Check, Loader2 } from 'lucide-react'
import { BASE_PATH } from '@/utils/url'

function SignupContent() {
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [fullName, setFullName] = useState('')
 const [companyName, setCompanyName] = useState('')
 const [orgNumber, setOrgNumber] = useState('')
 const [loading, setLoading] = useState(false)
 const [oauthLoading, setOauthLoading] = useState<'google' | 'azure' | null>(null)
 const [error, setError] = useState('')
 
 const router = useRouter()
 const searchParams = useSearchParams()
 const redirectTo = searchParams?.get('redirect') || '/onboarding'

 const handleOAuthSignup = async (provider: 'google' | 'azure') => {
  setOauthLoading(provider)
  setError('')
  try {
   const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
     redirectTo: `${window.location.origin}${BASE_PATH}/auth/callback?redirect=${encodeURIComponent(redirectTo)}&signup=true`,
    }
   })
   if (error) throw error
  } catch (err: any) {
   setError(err?.message || 'Fel vid registrering')
   setOauthLoading(null)
  }
 }
 
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
 
 const isAnyLoading = loading || oauthLoading !== null

 return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
   <div className="w-full max-w-md">
    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
     {/* Logo */}
     <div className="flex justify-center mb-6">
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
       <svg
        viewBox="0 0 24 24"
        className="w-10 h-10 text-primary-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
       >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
       </svg>
      </div>
     </div>

     {/* Tagline */}
     <p className="text-center text-gray-500 mb-8">
      30 dagars gratis provperiod. Inget betalkort krävs.
     </p>

     {/* Error Message */}
     {error && (
      <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
       {error}
      </div>
     )}

     {/* Social Login Buttons */}
     <div className="space-y-3 mb-6">
      <button
       type="button"
       onClick={() => handleOAuthSignup('google')}
       disabled={isAnyLoading}
       className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
       {oauthLoading === 'google' ? (
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
       ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
         <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
         />
         <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
         />
         <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
         />
         <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
         />
        </svg>
       )}
       <span className="text-gray-700 font-medium">Fortsätt med Google</span>
      </button>

      <button
       type="button"
       onClick={() => handleOAuthSignup('azure')}
       disabled={isAnyLoading}
       className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
       {oauthLoading === 'azure' ? (
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
       ) : (
        <svg className="w-5 h-5" viewBox="0 0 23 23">
         <path fill="#f35325" d="M1 1h10v10H1z" />
         <path fill="#81bc06" d="M12 1h10v10H12z" />
         <path fill="#05a6f0" d="M1 12h10v10H1z" />
         <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
       )}
       <span className="text-gray-700 font-medium">Fortsätt med Microsoft</span>
      </button>
     </div>

     {/* Divider */}
     <div className="relative mb-6">
      <div className="absolute inset-0 flex items-center">
       <div className="w-full border-t border-gray-200"></div>
      </div>
      <div className="relative flex justify-center text-sm">
       <span className="bg-white px-4 text-gray-500">eller</span>
      </div>
     </div>

     {/* Form */}
     <form onSubmit={handleSignup} className="space-y-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Fullständigt namn <span className="text-red-500">*</span>
       </label>
       <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        disabled={isAnyLoading}
        placeholder="Anna Andersson"
        className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        E-postadress <span className="text-red-500">*</span>
       </label>
       <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isAnyLoading}
        placeholder="anna@foretag.se"
        className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Lösenord <span className="text-red-500">*</span>
       </label>
       <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        disabled={isAnyLoading}
        placeholder="Minst 8 tecken"
        className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Företagsnamn <span className="text-red-500">*</span>
       </label>
       <input
        type="text"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
        disabled={isAnyLoading}
        placeholder="Bygg AB"
        className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
       />
      </div>

      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Organisationsnummer{" "}
        <span className="text-gray-400 font-normal">(valfritt)</span>
       </label>
       <input
        type="text"
        value={orgNumber}
        onChange={(e) => setOrgNumber(e.target.value)}
        disabled={isAnyLoading}
        placeholder="556123-4567"
        className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
       />
      </div>

      <button
       type="submit"
       disabled={isAnyLoading}
       className="w-full py-3.5 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
       {loading ? (
        <>
         <Loader2 className="w-5 h-5 animate-spin" />
         Skapar konto...
        </>
       ) : (
        'Skapa gratis konto'
       )}
      </button>
     </form>

     {/* Login Link */}
     <p className="text-center text-gray-500 mt-6">
      Har du redan ett konto?{" "}
      <a href={`${BASE_PATH}/login`} className="text-primary-500 hover:text-primary-600 hover:underline font-medium transition-colors">
       Logga in
      </a>
     </p>

     {/* Benefits */}
     <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm text-gray-500">
      <div className="flex items-center gap-1.5">
       <Check className="w-4 h-4 text-primary-500" />
       <span>30 dagar gratis</span>
      </div>
      <div className="flex items-center gap-1.5">
       <Check className="w-4 h-4 text-primary-500" />
       <span>Ingen bindningstid</span>
      </div>
      <div className="flex items-center gap-1.5">
       <Check className="w-4 h-4 text-primary-500" />
       <span>Inget betalkort</span>
      </div>
     </div>
    </div>

    {/* Footer */}
    <p className="text-center text-gray-400 text-sm mt-6">
     © 2026 Frost Apps
    </p>
   </div>
  </div>
 )
}

function SignupLoading() {
 return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
   <div className="text-gray-500 flex items-center gap-2">
    <Loader2 className="w-5 h-5 animate-spin" />
    Laddar...
   </div>
  </div>
 )
}

export default function SignupPage() {
 return (
  <Suspense fallback={<SignupLoading />}>
   <SignupContent />
  </Suspense>
 )
}
