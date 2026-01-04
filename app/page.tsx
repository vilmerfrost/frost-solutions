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

 // Logga in-vy om INGEN user
 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
   <div className="flex flex-col items-center rounded-3xl shadow-xl bg-white bg-opacity-75 p-10 max-w-lg w-full border border-blue-100 backdrop-blur">
    <FrostLogo size={60} />
    <h1 className="text-3xl font-semibold text-blue-700 mt-4 mb-2">Frost Solutions</h1>
    <p className="mb-6 text-lg text-blue-600 text-center">Logga in för att komma åt din dashboard och börja rapportera tid!</p>
    <button
     className="bg-blue-600 w-full text-white rounded-lg py-2 font-bold text-lg shadow hover:bg-blue-700 transition"
     onClick={() => router.push('/login')}
    >
     Logga in
    </button>
    <div className="mt-8 text-xs text-blue-400 font-mono tracking-wide select-none opacity-70">
     &copy; 2025 Frost Apps
    </div>
   </div>
  </div>
 )
}
