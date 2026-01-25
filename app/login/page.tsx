'use client'

import { sendMagicLink } from '../auth/actions'
import { useState, Suspense } from 'react'
import supabase from '@/utils/supabase/supabaseClient'
import FrostLogo from '../components/FrostLogo'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
 const [status, setStatus] = useState<string | null>(null)
 const [loading, setLoading] = useState(false)
 const router = useRouter()
 const searchParams = useSearchParams()
 const redirectTo = searchParams?.get('redirect') || '/dashboard'

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setLoading(true)
  setStatus(null)
  const formData = new FormData(e.currentTarget)
  try {
   await sendMagicLink(formData)
   setStatus('Magic Link skickad! Kolla din mail.')
  } catch (err: any) {
   setStatus(err?.message || 'Fel vid inloggning')
  } finally {
   setLoading(false)
  }
 }

 async function handleOAuthLogin(provider: 'google' | 'azure') {
  setLoading(true)
  setStatus(null)
  try {
   const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
     redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
    }
   })
   if (error) throw error
  } catch (err: any) {
   setStatus(err?.message || 'Fel vid inloggning')
   setLoading(false)
  }
 }

 return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
   <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-10">
    {/* Header */}
    <div className="flex flex-col items-center mb-8">
     <FrostLogo size={56} />
     <h1 className="font-semibold text-2xl sm:text-3xl mt-4 mb-2 text-gray-900">
      Frost Solutions
     </h1>
     <p className="text-gray-500 text-sm">Logga in för att fortsätta</p>
    </div>

    {/* OAuth Buttons */}
    <div className="space-y-3 mb-6">
     <button
      onClick={() => handleOAuthLogin('google')}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-lg py-3 px-4 font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
     >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
       <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
       <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
       <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
       <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Fortsätt med Google
     </button>
     
     <button
      onClick={() => handleOAuthLogin('azure')}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-lg py-3 px-4 font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
     >
      <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
       <path fill="#00A4EF" d="M0 0h11.377v11.372H0z"/>
       <path fill="#FFB900" d="M11.377 0H23v11.372H11.377z"/>
       <path fill="#7FBA00" d="M0 11.628h11.377V23H0z"/>
       <path fill="#F25022" d="M11.377 11.628H23V23H11.377z"/>
      </svg>
      Fortsätt med Microsoft
     </button>
    </div>

    {/* Divider */}
    <div className="relative mb-6">
     <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200"></div>
     </div>
     <div className="relative flex justify-center text-sm">
      <span className="px-3 bg-white text-gray-500">eller</span>
     </div>
    </div>

    {/* Email Form */}
    <form onSubmit={handleSubmit} className="w-full">
     <label className="block text-sm font-medium text-gray-700 mb-2">E-post</label>
     <input 
      name="email" 
      type="email" 
      required 
      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4 transition-all" 
      placeholder="din@epost.se"
     />
     <button
      type="submit"
      disabled={loading}
      className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-lg py-3 font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
     >
      {loading ? 'Skickar...' : 'Skicka Magic Link'}
     </button>
    </form>

    {/* Status Message */}
    {status && (
     <div className={`mt-4 p-3 rounded-lg text-sm ${
      status.includes('skickad') 
       ? 'bg-green-50 text-green-700 border border-green-200' 
       : 'bg-red-50 text-red-700 border border-red-200'
     }`}>
      {status}
     </div>
    )}

    {/* Sign Up Link */}
    <p className="mt-6 text-center text-sm text-gray-600">
     Ny användare?{' '}
     <a href="/signup" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">
      Skapa konto gratis
     </a>
    </p>

    {/* Footer */}
    <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
     © 2026 Frost Apps
    </div>
   </div>
  </div>
 )
}

export default function LoginPage() {
 return (
  <Suspense fallback={
   <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-gray-500">Laddar...</div>
   </div>
  }>
   <LoginContent />
  </Suspense>
 )
}
