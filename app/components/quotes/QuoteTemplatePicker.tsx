// app/components/quotes/QuoteTemplatePicker.tsx
'use client'

import React from 'react'
import { useQuoteTemplates } from '@/hooks/useQuoteTemplates'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface QuoteTemplatePickerProps {
 onSelect: (template: any) => void
}

export function QuoteTemplatePicker({ onSelect }: QuoteTemplatePickerProps) {
 const { data: templates, isLoading } = useQuoteTemplates()

 if (isLoading) {
  return <p className="text-sm text-gray-500">Laddar mallar...</p>
 }

 if (!templates || templates.length === 0) {
  return <p className="text-sm text-gray-500">Inga mallar tillgängliga</p>
 }

 return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
   {templates.map((template) => (
    <div
     key={template.id}
     className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
    >
     <div className="flex items-start gap-3">
      <div className="p-2 bg-blue-100 rounded-md">
       <FileText size={20} className="text-blue-600" />
      </div>
      <div className="flex-1">
       <h3 className="font-medium">{template.name}</h3>
       <p className="text-sm text-gray-500 mt-2">
        {Array.isArray(template.body) ? template.body.length : 0} artiklar
       </p>
      </div>
     </div>
     <Button
      size="sm"
      variant="outline"
      className="w-full mt-3"
      onClick={() => onSelect(template)}
     >
      Använd mall
     </Button>
    </div>
   ))}
  </div>
 )
}

