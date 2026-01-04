'use client'
import { useState } from 'react'
import { supabase } from '@/utils/supabase/supabaseClient'
import { useRouter } from 'next/navigation'
import FrostLogo from '../components/FrostLogo'

export default function PasswordSetupPage() {
 const router = useRouter()
 const [password, setPassword] = useState('')
 const [repeat, setRepeat] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')
 const [success, setSuccess] = useState(false)

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setError('')
  if(password.length < 8) {
   setError('Lösenordet måste vara minst 8 tecken')
   return
  }
  if(password !== repeat) {
   setError('Lösenorden matchar inte')
   return
  }
  setLoading(true)
  const { error } = await supabase.auth.updateUser({ password })
  setLoading(false)
  if(error){
   setError('Kunde inte spara lösenord, testa igen!')
   return
  }
  setSuccess(true)
  setTimeout(() => {
   router.push('/dashboard')
  }, 1500)
 }

 return (
  <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
   <div className="rounded-3xl shadow-xl bg-white bg-opacity-95 border border-blue-100 p-10 w-full max-w-md">
    <div className="flex items-center gap-3 mb-5">
     <FrostLogo size={30}/>
     <div className="font-semibold text-blue-700 text-xl">Sätt ditt lösenord</div>
    </div>
    <div className="mb-3 text-blue-600 text-base">
     Logga in första gången med Magic Link. 
     Välj valfritt lösenord nedan så kan du logga in ännu snabbare i framtiden – utan e-post varje gång!
    </div>
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
     <div>
      <label className="block text-blue-600 font-medium mb-1">Nytt lösenord</label>
      <input
       className="w-full border border-blue-200 rounded-[8px] px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
       type="password" autoComplete="new-password" required
       value={password}
       minLength={8}
       onChange={e => setPassword(e.target.value)}
      />
     </div>
     <div>
      <label className="block text-blue-600 font-medium mb-1">Upprepa lösenord</label>
      <input
       className="w-full border border-blue-200 rounded-[8px] px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
       type="password" autoComplete="new-password" required
       value={repeat}
       minLength={8}
       onChange={e => setRepeat(e.target.value)}
      />
     </div>
     {error && <div className="text-red-500 font-bold">{error}</div>}
     {success && <div className="text-green-500 font-bold">Lösenord satt! Du skickas till dashboard…</div>}

     <button type="submit" disabled={loading}
      className="mt-2 bg-blue-600 text-white rounded-[8px] font-bold text-lg shadow px-6 py-3 hover:bg-blue-700 transition">
      {loading ? "Sparar..." : "Spara lösenord"}
     </button>
    </form>
   </div>
  </div>
 )
}
