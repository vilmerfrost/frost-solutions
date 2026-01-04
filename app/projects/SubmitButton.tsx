'use client'
import { useFormStatus } from 'react-dom'

export default function SubmitButton() {
 const { pending } = useFormStatus()
 return (
  <button
   type="submit"
   disabled={pending}
   className={`btn-primary px-5 py-2 w-full sm:w-auto ${pending ? 'opacity-70 cursor-not-allowed' : ''}`}
  >
   {pending ? 'Skapar…' : 'Skapa projekt'}
  </button>
 )
}
