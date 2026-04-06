'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home, Search } from 'lucide-react'
import FrostLogo from '@/components/FrostLogo'
import { BASE_PATH } from '@/utils/url'

export default function NotFound() {
 const router = useRouter()

 return (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fffbeb,transparent_35%),linear-gradient(135deg,#fafaf9,#f5f5f4)] dark:bg-[radial-gradient(circle_at_top,#451a03,transparent_30%),linear-gradient(135deg,#1c1917,#292524)] px-4 py-10">
   <div className="mx-auto max-w-5xl">
    <div className="mb-6 flex h-4 overflow-hidden rounded-full shadow-sm">
     {Array.from({ length: 20 }).map((_, i) => (
      <div key={i} className={i % 2 === 0 ? 'flex-1 bg-primary-500' : 'flex-1 bg-stone-900 dark:bg-stone-700'} />
     ))}
    </div>

    <div className="grid gap-8 rounded-[32px] border border-stone-200/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(28,25,23,0.14)] backdrop-blur sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12 dark:border-stone-800 dark:bg-stone-900/90">
     <div className="space-y-6">
      <div className="flex items-center gap-4">
       <FrostLogo size={64} />
       <div>
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400">
         Frost Solutions
        </div>
        <div className="text-sm text-stone-600 dark:text-stone-300">
         Arbetsplatsen är avspärrad
        </div>
       </div>
      </div>

      <div className="space-y-4">
       <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
        404 Ritningen saknas
       </div>
       <h1 className="max-w-xl text-4xl font-bold leading-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
        Någon har tappat bort sidan i byggdammet
       </h1>
       <p className="max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300 sm:text-lg">
        Vi letade i containern, byggboden och under alla ritningar, men sidan finns inte här.
        Gå tillbaka till projektet eller skicka in en snabb felrapport om länken borde fungera.
       </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
       <button
        onClick={() => router.back()}
        className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 transition-all hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-900"
       >
        <ArrowLeft className="h-5 w-5" />
        Gå tillbaka
       </button>
       <button
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-primary-500 px-6 py-3 font-bold text-stone-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-md"
       >
        <Home className="h-5 w-5" />
        Till dashboard
       </button>
       <Link
        href={`${BASE_PATH}/feedback?type=bug&subject=${encodeURIComponent('Trasig länk eller saknad sida')}`}
        className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-stone-300 bg-stone-900 px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-stone-800 dark:border-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
       >
        <Search className="h-5 w-5" />
        Rapportera länken
       </Link>
      </div>
     </div>

     <div className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-stone-50 p-5 shadow-inner dark:border-stone-700 dark:bg-stone-950/60">
      <div className="absolute inset-0 opacity-40 dark:opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(120,113,108,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,0.18) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="relative">
       <div className="flex items-start justify-between gap-4">
        <div>
         <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
          Statusrapport
         </p>
         <h2 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-50">
          Byggplats tillfälligt stängd
         </h2>
        </div>
        <div className="rounded-[18px] bg-white p-4 shadow-lg dark:bg-stone-900">
         <Search className="h-10 w-10 text-primary-500" />
        </div>
       </div>

       <div className="mt-6 rounded-[22px] border-2 border-dashed border-stone-300 bg-white/80 p-5 dark:border-stone-700 dark:bg-stone-900/70">
        <div className="text-[5.5rem] font-black leading-none tracking-[-0.08em] text-stone-200 dark:text-stone-800">
         404
        </div>
        <div className="-mt-3 space-y-3">
         <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          Kontrollista
         </p>
         <div className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
          <div className="flex items-center gap-2">
           <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
           Ritningen finns inte i aktuell mapp
          </div>
          <div className="flex items-center gap-2">
           <span className="h-2.5 w-2.5 rounded-full bg-stone-400" />
           Länken kan vara gammal eller felstavad
          </div>
          <div className="flex items-center gap-2">
           <span className="h-2.5 w-2.5 rounded-full bg-stone-400" />
           Support kan spåra var sidan borde ligga
          </div>
         </div>
        </div>
       </div>

       <div className="mt-5 rounded-[20px] bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(255,255,255,0.5))] p-4 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(41,37,36,0.6))]">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
         Proffstips
        </p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
         Om du kom hit från en knapp i appen vill vi gärna ha länken. Då kan vi laga den snabbare.
        </p>
      </div>
      </div>
     </div>
    </div>
   </div>
  </div>
 )
}
