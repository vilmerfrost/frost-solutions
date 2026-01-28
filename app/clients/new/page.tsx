'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { apiFetch } from '@/lib/http/fetcher'
import { BASE_PATH } from '@/utils/url'
import { 
 Building2, 
 User, 
 MapPin, 
 FileText,
 ChevronLeft,
 Loader2,
 Globe,
 UserCircle
} from 'lucide-react'

type ClientType = 'private' | 'company'

export default function NewClientPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [loading, setLoading] = useState(false)
 
 // Client type
 const [clientType, setClientType] = useState<ClientType>('company')

 // ===== PRIVATE CUSTOMER FIELDS =====
 const [firstName, setFirstName] = useState('')
 const [lastName, setLastName] = useState('')
 const [personalId, setPersonalId] = useState('')
 const [propertyDesignation, setPropertyDesignation] = useState('')
 
 // Home address
 const [homeStreet, setHomeStreet] = useState('')
 const [homePostal, setHomePostal] = useState('')
 const [homeCity, setHomeCity] = useState('')
 
 // Work address (private)
 const [workSameAsHome, setWorkSameAsHome] = useState(true)
 const [workStreet, setWorkStreet] = useState('')
 const [workPostal, setWorkPostal] = useState('')
 const [workCity, setWorkCity] = useState('')

 // ===== COMPANY FIELDS =====
 const [companyName, setCompanyName] = useState('')
 const [orgNumber, setOrgNumber] = useState('')
 const [website, setWebsite] = useState('')
 
 // HQ address
 const [hqStreet, setHqStreet] = useState('')
 const [hqPostal, setHqPostal] = useState('')
 const [hqCity, setHqCity] = useState('')
 
 // Invoice address (company)
 const [invoiceSameAsHq, setInvoiceSameAsHq] = useState(true)
 const [invoiceStreet, setInvoiceStreet] = useState('')
 const [invoicePostal, setInvoicePostal] = useState('')
 const [invoiceCity, setInvoiceCity] = useState('')
 
 // Contact person (company)
 const [contactName, setContactName] = useState('')
 const [contactEmail, setContactEmail] = useState('')
 const [contactPhone, setContactPhone] = useState('')
 const [contactTitle, setContactTitle] = useState('')

 // ===== COMMON FIELDS =====
 const [email, setEmail] = useState('')
 const [phone, setPhone] = useState('')
 const [notes, setNotes] = useState('')

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  
  if (!tenantId) {
   toast.error('Ingen tenant satt. Logga in eller välj tenant först.')
   return
  }

  // Validation
  if (clientType === 'private') {
   if (!firstName.trim() || !lastName.trim()) {
    toast.error('Förnamn och efternamn krävs')
    return
   }
   if (!homeStreet.trim() || !homePostal.trim() || !homeCity.trim()) {
    toast.error('Fullständig boendeadress krävs')
    return
   }
  } else {
   if (!companyName.trim()) {
    toast.error('Företagsnamn krävs')
    return
   }
   if (!orgNumber.trim()) {
    toast.error('Organisationsnummer krävs')
    return
   }
   if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
    toast.error('Kontaktperson krävs (namn, email, telefon)')
    return
   }
  }

  setLoading(true)

  try {
   const payload: any = {
    tenantId,
    clientType,
    email: email.trim() || null,
    phone: phone.trim() || null,
    notes: notes.trim() || null,
   }

   if (clientType === 'private') {
    payload.name = `${firstName.trim()} ${lastName.trim()}`
    payload.firstName = firstName.trim()
    payload.lastName = lastName.trim()
    payload.personalId = personalId.trim() || null
    payload.propertyDesignation = propertyDesignation.trim() || null
    
    // Home address
    payload.streetAddress = homeStreet.trim()
    payload.postalCode = homePostal.trim()
    payload.city = homeCity.trim()
    
    // Work address
    payload.workSameAsHome = workSameAsHome
    if (!workSameAsHome) {
     payload.workStreetAddress = workStreet.trim()
     payload.workPostalCode = workPostal.trim()
     payload.workCity = workCity.trim()
    }
   } else {
    payload.name = companyName.trim()
    payload.orgNumber = orgNumber.trim()
    payload.website = website.trim() || null
    
    // HQ address
    payload.streetAddress = hqStreet.trim()
    payload.postalCode = hqPostal.trim()
    payload.city = hqCity.trim()
    
    // Invoice address
    payload.invoiceSameAsMain = invoiceSameAsHq
    if (!invoiceSameAsHq) {
     payload.invoiceStreetAddress = invoiceStreet.trim()
     payload.invoicePostalCode = invoicePostal.trim()
     payload.invoiceCity = invoiceCity.trim()
    }
    
    // Contact person
    payload.contactPersonName = contactName.trim()
    payload.contactPersonEmail = contactEmail.trim()
    payload.contactPersonPhone = contactPhone.trim()
    payload.contactPersonTitle = contactTitle.trim() || null
   }

   await apiFetch('/api/clients/create', {
    method: 'POST',
    body: JSON.stringify(payload),
   })

   toast.success('Kund skapad!')
   router.replace(`${BASE_PATH}/clients`)
  } catch (err: any) {
   toast.error('Kunde inte skapa kund: ' + (err.message || 'Okänt fel'))
  } finally {
   setLoading(false)
  }
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
       Ny kund
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
       {clientType === 'private' ? 'Lägg till en privatperson' : 'Lägg till ett företag'}
      </p>
     </div>

     <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Type Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Kundtyp *
       </label>
       <div className="grid grid-cols-2 gap-3">
        <button
         type="button"
         onClick={() => setClientType('company')}
         className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 font-semibold transition-all ${
          clientType === 'company'
           ? 'bg-primary-500 text-white border-primary-500 shadow-md'
           : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300'
         }`}
        >
         <Building2 className="w-5 h-5" />
         Företag
        </button>
        <button
         type="button"
         onClick={() => setClientType('private')}
         className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 font-semibold transition-all ${
          clientType === 'private'
           ? 'bg-primary-500 text-white border-primary-500 shadow-md'
           : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300'
         }`}
        >
         <User className="w-5 h-5" />
         Privat
        </button>
       </div>
      </div>

      {/* ===== PRIVATE CUSTOMER FORM ===== */}
      {clientType === 'private' && (
       <>
        {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" />
          Personuppgifter
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

         <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
           Personnummer *
          </label>
          <input
           type="text"
           value={personalId}
           onChange={(e) => setPersonalId(e.target.value)}
           className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           placeholder="YYYYMMDD-XXXX"
          />
          <p className="mt-1 text-xs text-gray-500">Krävs för ROT-avdrag</p>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            E-post *
           </label>
           <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="namn@exempel.se"
            required
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
        </div>

        {/* Home Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-500" />
          Boendeadress
         </h2>

         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
           Gatuadress *
          </label>
          <input
           type="text"
           value={homeStreet}
           onChange={(e) => setHomeStreet(e.target.value)}
           className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           placeholder="Storgatan 1"
           required
          />
         </div>

         <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Postnummer *
           </label>
           <input
            type="text"
            value={homePostal}
            onChange={(e) => setHomePostal(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="123 45"
            required
           />
          </div>
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stad *
           </label>
           <input
            type="text"
            value={homeCity}
            onChange={(e) => setHomeCity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="Stockholm"
            required
           />
          </div>
         </div>
        </div>

        {/* Work Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Jobbadress (om annan än boendeadress)
         </h2>

         <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
           type="checkbox"
           checked={workSameAsHome}
           onChange={(e) => setWorkSameAsHome(e.target.checked)}
           className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Samma som boendeadress</span>
         </label>

         {!workSameAsHome && (
          <>
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             Gatuadress
            </label>
            <input
             type="text"
             value={workStreet}
             onChange={(e) => setWorkStreet(e.target.value)}
             className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
             placeholder="Arbetsvägen 10"
            />
           </div>
           <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Postnummer
             </label>
             <input
              type="text"
              value={workPostal}
              onChange={(e) => setWorkPostal(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="123 45"
             />
            </div>
            <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stad
             </label>
             <input
              type="text"
              value={workCity}
              onChange={(e) => setWorkCity(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Stockholm"
             />
            </div>
           </div>
          </>
         )}
        </div>

        {/* Property Designation for ROT */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          Fastighetsbeteckning (för ROT-avdrag)
         </h2>

         <input
          type="text"
          value={propertyDesignation}
          onChange={(e) => setPropertyDesignation(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="T.ex. Sätra 4:22"
         />
         <p className="mt-1 text-xs text-gray-500">Hittas i fastighetsregistret eller på senaste fastighetstaxeringen</p>
        </div>
       </>
      )}

      {/* ===== COMPANY FORM ===== */}
      {clientType === 'company' && (
       <>
        {/* Company Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-500" />
          Företagsinfo
         </h2>

         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
           Företagsnamn *
          </label>
          <input
           type="text"
           value={companyName}
           onChange={(e) => setCompanyName(e.target.value)}
           className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           placeholder="AB Företaget"
           required
          />
         </div>

         <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
           Organisationsnummer *
          </label>
          <input
           type="text"
           value={orgNumber}
           onChange={(e) => setOrgNumber(e.target.value)}
           className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           placeholder="556677-8899"
           required
          />
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            E-post *
           </label>
           <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="info@foretaget.se"
            required
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
            placeholder="08-123 45 67"
            required
           />
          </div>
         </div>

         <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
           <Globe className="w-4 h-4" />
           Webbsida (frivillig)
          </label>
          <input
           type="url"
           value={website}
           onChange={(e) => setWebsite(e.target.value)}
           className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           placeholder="https://www.foretaget.se"
          />
         </div>
        </div>

        {/* HQ Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-500" />
          Huvudkontor
         </h2>

         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
           Gatuadress *
          </label>
          <input
           type="text"
           value={hqStreet}
           onChange={(e) => setHqStreet(e.target.value)}
           className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
           placeholder="Storgatan 1"
           required
          />
         </div>

         <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Postnummer *
           </label>
           <input
            type="text"
            value={hqPostal}
            onChange={(e) => setHqPostal(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="123 45"
            required
           />
          </div>
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stad *
           </label>
           <input
            type="text"
            value={hqCity}
            onChange={(e) => setHqCity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="Stockholm"
            required
           />
          </div>
         </div>
        </div>

        {/* Invoice Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fakturaadress (om annan)
         </h2>

         <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
           type="checkbox"
           checked={invoiceSameAsHq}
           onChange={(e) => setInvoiceSameAsHq(e.target.checked)}
           className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Samma som huvudkontor</span>
         </label>

         {!invoiceSameAsHq && (
          <>
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             Gatuadress
            </label>
            <input
             type="text"
             value={invoiceStreet}
             onChange={(e) => setInvoiceStreet(e.target.value)}
             className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
             placeholder="Fakturavägen 5"
            />
           </div>
           <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Postnummer
             </label>
             <input
              type="text"
              value={invoicePostal}
              onChange={(e) => setInvoicePostal(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="123 45"
             />
            </div>
            <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stad
             </label>
             <input
              type="text"
              value={invoiceCity}
              onChange={(e) => setInvoiceCity(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Stockholm"
             />
            </div>
           </div>
          </>
         )}
        </div>

        {/* Contact Person */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-primary-500" />
          Kontaktperson
         </h2>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Namn *
           </label>
           <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="Anna Andersson"
            required
           />
          </div>
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            E-post *
           </label>
           <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="anna@foretaget.se"
            required
           />
          </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Telefon *
           </label>
           <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="070-123 45 67"
            required
           />
          </div>
          <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Titel
           </label>
           <input
            type="text"
            value={contactTitle}
            onChange={(e) => setContactTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="Inköpschef"
           />
          </div>
         </div>
        </div>
       </>
      )}

      {/* Notes (Common) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-500" />
        Noteringar
       </h2>

       <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
        rows={4}
        placeholder="Interna noteringar om kunden..."
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
         'Lägg till'
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
