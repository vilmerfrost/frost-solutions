'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from './utils/supabase/supabaseClient'
import FrostLogo from './components/FrostLogo'

export default function HomePage() {
 const router = useRouter()
 const [checked, setChecked] = useState(false)
 const [user, setUser] = useState<any>(null)

 useEffect(() => {
  async function checkOnboarding() {
   const { data: { user } } = await supabase.auth.getUser()

   // Tenant resolution handled via TenantContext and useTenant() hook
   
   setUser(user)
   setChecked(true)
   if (user) {
    // Om du har onboarding att checka, använd den nedan
    // if (!user.onboarded) { router.push('/onboarding') }
    // else
    router.push('/dashboard')
   }
  }
  checkOnboarding()
 }, [router])

 if (!checked || user) return null // Vänta på auth check eller redirect

 // Landing page om INGEN user
 return (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
   <div className="flex flex-col items-center bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-10 max-w-md w-full">
    <FrostLogo size={56} />
    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-4 mb-2">Frost Solutions</h1>
    <p className="mb-6 text-sm text-gray-500 text-center">
     Tidsrapportering och fakturering för byggföretag
    </p>
    
    {/* Primary CTA - Signup */}
    <button
     className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-lg py-3 font-semibold shadow-sm hover:shadow-md transition-all mb-3"
     onClick={() => router.push('/signup')}
    >
     Kom igång gratis
    </button>
    
    {/* Secondary CTA - Login */}
    <button
     className="w-full bg-white border border-gray-200 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
     onClick={() => router.push('/login')}
    >
     Logga in
    </button>

    {/* Trial info */}
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
     <span className="flex items-center gap-1">
      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      30 dagar gratis
     </span>
     <span className="flex items-center gap-1">
      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      Inget betalkort
     </span>
    </div>

    <div className="mt-6 pt-6 border-t border-gray-100 w-full text-center text-xs text-gray-400">
     © 2026 Frost Apps
    </div>
   </div>
  </div>
 )
}
