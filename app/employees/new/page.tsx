'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { useAdmin } from '@/hooks/useAdmin'
import { apiFetch } from '@/lib/http/fetcher'
import { BASE_PATH } from '@/utils/url'
import { 
 User, 
 Briefcase, 
 Shield, 
 DollarSign, 
 Phone, 
 FileText,
 ChevronLeft,
 Loader2
} from 'lucide-react'

type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR'
type JobRole = 'PROJECT_MANAGER' | 'CARPENTER' | 'PLUMBER' | 'PAINTER' | 'ELECTRICIAN' | 'WAREHOUSE' | 'OFFICE' | 'OTHER'

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
 { value: 'FULL_TIME', label: 'Fast anställd' },
 { value: 'PART_TIME', label: 'Deltid' },
 { value: 'CONTRACTOR', label: 'Vikarie/Konsult' },
]

const JOB_ROLES: { value: JobRole; label: string }[] = [
 { value: 'PROJECT_MANAGER', label: 'Projektledare' },
 { value: 'CARPENTER', label: 'Snickare' },
 { value: 'PLUMBER', label: 'VVS-installatör' },
 { value: 'PAINTER', label: 'Målare' },
 { value: 'ELECTRICIAN', label: 'Elektriker' },
 { value: 'WAREHOUSE', label: 'Lagerarbetare' },
 { value: 'OFFICE', label: 'Kontor' },
 { value: 'OTHER', label: 'Annat' },
]

export default function NewEmployeePage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const { isAdmin, loading: adminLoading } = useAdmin()
 const [loading, setLoading] = useState(false)

 // Basic info
 const [firstName, setFirstName] = useState('')
 const [lastName, setLastName] = useState('')
 const [email, setEmail] = useState('')
 const [phone, setPhone] = useState('')
 const [personalId, setPersonalId] = useState('')

 // Employment info
 const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME')
 const [jobRole, setJobRole] = useState<JobRole | ''>('')
 const [role, setRole] = useState<'employee' | 'admin'>('employee')
 const [startDate, setStartDate] = useState('')

 // Competencies
 const [hasDriversLicense, setHasDriversLicense] = useState(false)
 const [isOver19, setIsOver19] = useState(false)
 const [hasSafetyTraining, setHasSafetyTraining] = useState(false)
 const [hasRotEligibility, setHasRotEligibility] = useState(false)
 const [hasElectricalCert, setHasElectricalCert] = useState(false)
 const [hasFallProtection, setHasFallProtection] = useState(false)

 // Salary info
 const [baseRate, setBaseRate] = useState('360')
 const [monthlySalary, setMonthlySalary] = useState('')

 // Emergency contact
 const [emergencyName, setEmergencyName] = useState('')
 const [emergencyPhone, setEmergencyPhone] = useState('')

 // Notes
 const [notes, setNotes] = useState('')

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  
  if (!isAdmin) {
   toast.error('Endast administratörer kan lägga till anställda.')
   return
  }
  
  if (!tenantId) {
   toast.error('Ingen tenant satt. Logga in eller välj tenant först.')
   return
  }

  if (!firstName.trim() || !lastName.trim()) {
   toast.error('Förnamn och efternamn krävs')
   return
  }

  if (!phone.trim()) {
   toast.error('Telefonnummer krävs')
   return
  }

  setLoading(true)

  try {
   const fullName = `${firstName.trim()} ${lastName.trim()}`
   const normalizedRole = role.toLowerCase()
   
   const payload: any = {
    tenant_id: tenantId,
    name: fullName,
    full_name: fullName,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    role: normalizedRole,
    base_rate_sek: Number(baseRate) || 360,
    default_rate_sek: Number(baseRate) || 360,
    
    // New fields
    phone: phone.trim(),
    personal_id: personalId.trim() || null,
    employment_type: employmentType,
    job_role: jobRole || null,
    start_date: startDate || null,
    
    // Competencies
    has_drivers_license: hasDriversLicense,
    is_over_19: isOver19,
    has_safety_training: hasSafetyTraining,
    has_rot_eligibility: hasRotEligibility,
    has_electrical_cert: hasElectricalCert,
    has_fall_protection: hasFallProtection,
    
    // Salary
    monthly_salary_gross: monthlySalary ? Number(monthlySalary) : null,
    
    // Emergency
    emergency_contact_name: emergencyName.trim() || null,
    emergency_contact_phone: emergencyPhone.trim() || null,
    
    // Notes
    notes: notes.trim() || null,
   }

   if (email.trim()) {
    payload.email = email.trim()
   }

   const result = await apiFetch<{ error?: string; data?: any }>('/api/employees/create', {
    method: 'POST',
    body: JSON.stringify(payload),
   })
   
   if (result.error) {
    throw new Error(result.error)
   }

   toast.success('Anställd skapad!')
   router.replace(`${BASE_PATH}/employees`)
  } catch (err: any) {
   console.error('Unexpected error:', err)
   toast.error('Ett oväntat fel uppstod: ' + (err.message || 'Okänt fel'))
  } finally {
   setLoading(false)
  }
 }

 if (adminLoading) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden flex items-center justify-center">
     <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </main>
   </div>
  )
 }

 if (!isAdmin) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
     <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
       <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Åtkomst nekad</h2>
       <p className="text-red-600 dark:text-red-400">Endast administratörer kan lägga till anställda.</p>
       <button
        onClick={() => router.back()}
        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
       >
        Tillbaka
       </button>
      </div>
     </div>
    </main>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6">
      <button
       onClick={() => router.back()}
       className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
       <ChevronLeft className="w-5 h-5" />
       Tillbaka
      </button>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
       Lägg till anställd
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Registrera en ny medarbetare</p>
     </div>

     <form onSubmit={handleSubmit} className="space-y-6">
      {/* GRUNDLÄGGANDE INFORMATION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-primary-500" />
        Grundläggande information
       </h2>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Förnamn *
         </label>
         <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="Förnamn"
          required
         />
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Efternamn *
         </label>
         <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="Efternamn"
          required
         />
        </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          E-post
         </label>
         <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="namn@example.com"
         />
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefon *
         </label>
         <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="070-123 45 67"
          required
         />
        </div>
       </div>

       <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
         Personnummer
        </label>
        <input
         type="text"
         value={personalId}
         onChange={(e) => setPersonalId(e.target.value)}
         className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         placeholder="YYYYMMDD-XXXX"
        />
        <p className="mt-1 text-xs text-gray-500">Lagras krypterat</p>
       </div>
      </div>

      {/* ANSTÄLLNINGSINFO */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-primary-500" />
        Anställningsinfo
       </h2>

       <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
         Anställningstyp *
        </label>
        <div className="flex flex-wrap gap-3">
         {EMPLOYMENT_TYPES.map((type) => (
          <label
           key={type.value}
           className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
            employmentType === type.value
             ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
             : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
           }`}
          >
           <input
            type="radio"
            name="employmentType"
            value={type.value}
            checked={employmentType === type.value}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
            className="sr-only"
           />
           <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            employmentType === type.value ? 'border-primary-500' : 'border-gray-400'
           }`}>
            {employmentType === type.value && (
             <span className="w-2 h-2 rounded-full bg-primary-500" />
            )}
           </span>
           <span className="text-gray-900 dark:text-white">{type.label}</span>
          </label>
         ))}
        </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Huvudsaklig roll
         </label>
         <select
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value as JobRole)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         >
          <option value="">Välj roll...</option>
          {JOB_ROLES.map((r) => (
           <option key={r.value} value={r.value}>{r.label}</option>
          ))}
         </select>
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Systembehörighet *
         </label>
         <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'employee' | 'admin')}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          required
         >
          <option value="employee">Anställd</option>
          <option value="admin">Administratör</option>
         </select>
        </div>
       </div>

       <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
         Startdatum
        </label>
        <input
         type="date"
         value={startDate}
         onChange={(e) => setStartDate(e.target.value)}
         className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        />
       </div>
      </div>

      {/* KOMPETENSER & CERTIFIERINGAR */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary-500" />
        Kompetenser & Certifieringar
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
         { id: 'drivers', label: 'Körkort (B)', state: hasDriversLicense, setter: setHasDriversLicense },
         { id: 'over19', label: 'Förare 19+ (tunga fordon)', state: isOver19, setter: setIsOver19 },
         { id: 'safety', label: 'Arbetsmiljöutbildning', state: hasSafetyTraining, setter: setHasSafetyTraining },
         { id: 'rot', label: 'ROT-avdrag OK', state: hasRotEligibility, setter: setHasRotEligibility },
         { id: 'electrical', label: 'Elsäkerhet (el-certifikat)', state: hasElectricalCert, setter: setHasElectricalCert },
         { id: 'fall', label: 'Fallsäkerhet', state: hasFallProtection, setter: setHasFallProtection },
        ].map((comp) => (
         <label
          key={comp.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
         >
          <input
           type="checkbox"
           checked={comp.state}
           onChange={(e) => comp.setter(e.target.checked)}
           className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-gray-700 dark:text-gray-300">{comp.label}</span>
         </label>
        ))}
       </div>
      </div>

      {/* LÖNEINFO */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-primary-500" />
        Löneinfo
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Timpris (SEK) *
         </label>
         <input
          type="number"
          value={baseRate}
          onChange={(e) => setBaseRate(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="360"
          min="1"
          required
         />
         <p className="mt-1 text-xs text-gray-500">Används för tidsrapportering</p>
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Månadslön brutto (SEK)
         </label>
         <input
          type="number"
          value={monthlySalary}
          onChange={(e) => setMonthlySalary(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="35000"
          min="0"
         />
         <p className="mt-1 text-xs text-gray-500">Kontoret fyller i senare</p>
        </div>
       </div>
      </div>

      {/* NÖDKONTAKT */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary-500" />
        Nödkontakt
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Namn
         </label>
         <input
          type="text"
          value={emergencyName}
          onChange={(e) => setEmergencyName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="Anhörigs namn"
         />
        </div>
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefon
         </label>
         <input
          type="tel"
          value={emergencyPhone}
          onChange={(e) => setEmergencyPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="070-123 45 67"
         />
        </div>
       </div>
      </div>

      {/* ANTECKNINGAR */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-500" />
        Anteckningar
       </h2>

       <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
        rows={4}
        placeholder="Interna noteringar om den anställde..."
       />
      </div>

      {/* Submit buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
       <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
       >
        {loading ? (
         <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Sparar...
         </>
        ) : (
         'Lägg till anställd'
        )}
       </button>
       <button
        type="button"
        onClick={() => router.back()}
        className="px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
       >
        Avbryt
       </button>
      </div>
     </form>
    </div>
   </main>
  </div>
 )
}
