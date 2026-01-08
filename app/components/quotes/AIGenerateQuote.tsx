// app/components/quotes/AIGenerateQuote.tsx
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Sparkles, Loader2, X } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useProjects } from '@/hooks/useProjects'

interface AIGenerateQuoteProps {
 onGenerate: (prompt: string, context: any) => Promise<void>
 isLoading?: boolean
 onClose?: () => void
}

export function AIGenerateQuote({ onGenerate, isLoading = false, onClose }: AIGenerateQuoteProps) {
 const { data: clients } = useClients()
 const { data: projects } = useProjects()
 
 const [showForm, setShowForm] = useState(false)
 const [formData, setFormData] = useState({
  customer_id: '',
  project_id: '',
  project_type: '',
  description: '',
  budget_range: '',
  special_requirements: '',
 })

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  const prompt = `Skapa en offert för:
- Kund: ${clients?.find(c => c.id === formData.customer_id)?.name || 'Okänd'}
- Projekttyp: ${formData.project_type || 'Allmänt'}
- Beskrivning: ${formData.description}
- Budget: ${formData.budget_range || 'Ej angiven'}
- Särskilda krav: ${formData.special_requirements || 'Inga'}`

  const context = {
   customer_id: formData.customer_id,
   project_id: formData.project_id,
   project_type: formData.project_type,
   description: formData.description,
   budget_range: formData.budget_range,
   special_requirements: formData.special_requirements,
  }

  try {
   const res = await fetch('/api/quotes/ai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context }),
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to generate quote')
   }

   const result = await res.json()
   await onGenerate(prompt, context)
   
   // Reset form
   setFormData({
    customer_id: '',
    project_id: '',
    project_type: '',
    description: '',
    budget_range: '',
    special_requirements: '',
   })
   setShowForm(false)
  } catch (error: any) {
   console.error('AI Generate Error:', error)
   alert(`Fel: ${error.message}`)
  }
 }

 if (!showForm) {
  return (
   <Button
    type="button"
    onClick={() => setShowForm(true)}
    className="bg-primary-500 hover:bg-primary-600 hover: hover: hover: shadow-md hover:shadow-xl transition-all duration-200 text-white font-semibold"
   >
    <Sparkles size={18} className="mr-2" />
    AI Generera Offert
   </Button>
  )
 }

 return (
  <div className="bg-gray-50 dark:bg-gray-900 dark:bg-primary-900/20 rounded-[8px] border-2 border-primary-200 dark:border-primary-700 p-6 shadow-xl mb-6">
   <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
     <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
      <Sparkles size={24} className="text-primary-500 dark:text-primary-400" />
     </div>
     <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
       AI Generera Offert
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
       Ge AI information om offerten så genererar den en komplett offert åt dig
      </p>
     </div>
    </div>
    {onClose && (
     <Button
      variant="ghost"
      size="sm"
      onClick={() => {
       setShowForm(false)
       onClose?.()
      }}
      className="hover:bg-gray-100 dark:hover:bg-gray-700"
     >
      <X size={18} />
     </Button>
    )}
   </div>

   <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <Select
      label="Kund *"
      name="customer_id"
      value={formData.customer_id}
      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
      required
     >
      <option value="">Välj kund</option>
      {clients?.map((client) => (
       <option key={client.id} value={client.id}>
        {client.name}
       </option>
      ))}
     </Select>

     <Select
      label="Projekt (valfritt)"
      name="project_id"
      value={formData.project_id}
      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
     >
      <option value="">Inget projekt</option>
      {projects?.map((project) => (
       <option key={project.id} value={project.id}>
        {project.name}
       </option>
      ))}
     </Select>

     <Select
      label="Projekttyp *"
      name="project_type"
      value={formData.project_type}
      onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
      required
     >
      <option value="">Välj projekttyp</option>
      <option value="Takrenovering">Takrenovering</option>
      <option value="Fasadrenovering">Fasadrenovering</option>
      <option value="Badrumsrenovering">Badrumsrenovering</option>
      <option value="Köksrenovering">Köksrenovering</option>
      <option value="Elarbete">Elarbete</option>
      <option value="Rörmokeri">Rörmokeri</option>
      <option value="Målning">Målning</option>
      <option value="Golvläggning">Golvläggning</option>
      <option value="Nybyggnad">Nybyggnad</option>
      <option value="Övrigt">Övrigt</option>
     </Select>

     <Input
      label="Budget (valfritt)"
      name="budget_range"
      value={formData.budget_range}
      onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
      placeholder="T.ex. 100 000 - 150 000 kr"
     />
    </div>

    <Textarea
     label="Beskrivning av projektet *"
     name="description"
     value={formData.description}
     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
     rows={4}
     placeholder="Beskriv vad som ska göras, omfattning, material, etc..."
     required
    />

    <Textarea
     label="Särskilda krav eller önskemål (valfritt)"
     name="special_requirements"
     value={formData.special_requirements}
     onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
     rows={2}
     placeholder="T.ex. Miljövänliga material, specifika leverantörer, tidsramar..."
    />

    <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary-200 dark:border-primary-700">
     <Button
      type="button"
      variant="outline"
      onClick={() => {
       setShowForm(false)
       onClose?.()
      }}
      disabled={isLoading}
      className="border-2"
     >
      Avbryt
     </Button>
     <Button
      type="submit"
      disabled={isLoading || !formData.customer_id || !formData.project_type || !formData.description}
      className="bg-primary-500 hover:bg-primary-600 hover: hover: hover: shadow-md hover:shadow-xl transition-all duration-200 text-white font-semibold disabled:opacity-50"
     >
      {isLoading ? (
       <>
        <Loader2 size={18} className="mr-2 animate-spin" />
        Genererar...
       </>
      ) : (
       <>
        <Sparkles size={18} className="mr-2" />
        Generera Offert
       </>
      )}
     </Button>
    </div>
   </form>
  </div>
 )
}

