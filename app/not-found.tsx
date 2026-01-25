'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Home, Search } from 'lucide-react'
import FrostLogo from '@/components/FrostLogo'

export default function NotFound() {
 const router = useRouter()

 return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
   <div className="max-w-md w-full text-center">
    {/* Logo */}
    <div className="mb-8">
     <FrostLogo size={64} />
    </div>

    {/* 404 Illustration */}
    <div className="relative mb-8">
     <div className="text-[150px] font-bold text-gray-200 leading-none select-none">
      404
     </div>
     <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 transform -rotate-3">
       <Search className="w-12 h-12 text-primary-500" />
      </div>
     </div>
    </div>

    {/* Message */}
    <h1 className="text-2xl font-bold text-gray-900 mb-3">
     Sidan kunde inte hittas
    </h1>
    <p className="text-gray-600 mb-8">
     Sidan du letar efter finns inte eller har flyttats. 
     Kontrollera adressen eller gå tillbaka.
    </p>

    {/* Actions */}
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
     <button
      onClick={() => router.back()}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
     >
      <ArrowLeft className="w-5 h-5" />
      Gå tillbaka
     </button>
     <button
      onClick={() => router.push('/dashboard')}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-all shadow-sm"
     >
      <Home className="w-5 h-5" />
      Till Dashboard
     </button>
    </div>

    {/* Footer */}
    <p className="mt-12 text-sm text-gray-400">
     Om problemet kvarstår, kontakta support.
    </p>
   </div>
  </div>
 )
}
