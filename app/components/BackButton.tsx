'use client'
import { useRouter } from 'next/navigation'

export default function BackButton() {
 const router = useRouter()
 return (
  <button
   className="mb-4 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-semibold"
   onClick={() => router.back()}
   type="button"
  >
   ← Tillbaka
  </button>
 )
}
