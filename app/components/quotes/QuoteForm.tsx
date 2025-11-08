// app/components/quotes/QuoteForm.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { QuoteItemsEditor } from './QuoteItemsEditor'
import { useClients } from '@/hooks/useClients'
import { useProjects } from '@/hooks/useProjects'
import { ArrowLeft } from 'lucide-react'
import type { Quote } from '@/types/quotes'

interface QuoteFormProps {
  quote?: Quote
  onSubmit: (data: Partial<Quote>) => Promise<void>
  isLoading: boolean
}

export function QuoteForm({ quote, onSubmit, isLoading }: QuoteFormProps) {
  const router = useRouter()
  const { data: clients } = useClients()
  const { data: projects } = useProjects()

  const [formData, setFormData] = useState({
    title: quote?.title || '',
    notes: quote?.notes || '',
    customer_id: quote?.customer_id || '',
    project_id: quote?.project_id || '',
    valid_until: quote?.valid_until ? quote.valid_until.split('T')[0] : '',
    currency: quote?.currency || 'SEK',
    kma_enabled: quote?.kma_enabled || false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (quote) {
      setFormData({
        title: quote.title || '',
        notes: quote.notes || '',
        customer_id: quote.customer_id || '',
        project_id: quote.project_id || '',
        valid_until: quote.valid_until ? quote.valid_until.split('T')[0] : '',
        currency: quote.currency || 'SEK',
        kma_enabled: quote.kma_enabled || false
      })
    }
  }, [quote])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Titel är obligatorisk'
    }
    if (!formData.customer_id) {
      newErrors.customer_id = 'Kund är obligatorisk'
    }
    if (!formData.valid_until) {
      newErrors.valid_until = 'Giltig till-datum är obligatoriskt'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Tillbaka
      </Button>

      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-sm bg-opacity-95">
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
          Grundläggande Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Titel *"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="T.ex. Takrenoveringsprojekt"
          />

          <Select
            label="Kund *"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            error={errors.customer_id}
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
            value={formData.project_id || ''}
            onChange={handleChange}
          >
            <option value="">Inget projekt</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>

          <Input
            label="Giltig till *"
            name="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={handleChange}
            error={errors.valid_until}
          />

          <Select
            label="Valuta"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
          >
            <option value="SEK">SEK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </Select>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="kma_enabled"
              name="kma_enabled"
              checked={formData.kma_enabled}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="kma_enabled" className="text-sm font-medium text-gray-700">
              KMA aktiverad
            </label>
          </div>
        </div>

        <div className="mt-4">
          <Textarea
            label="Anteckningar"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Interna anteckningar..."
          />
        </div>
      </div>

      {/* Items Editor (only if editing existing quote) */}
      {quote && (
        <QuoteItemsEditor quoteId={quote.id} />
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Avbryt
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Sparar...' : quote ? 'Uppdatera Offert' : 'Skapa Offert'}
        </Button>
      </div>
    </form>
  )
}

