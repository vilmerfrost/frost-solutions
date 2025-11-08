// app/components/quotes/MaterialPicker.tsx
'use client'

import React, { useState } from 'react'
import { useMaterials } from '@/hooks/useMaterials'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface MaterialPickerProps {
  onSelect: (material: any) => void
}

export function MaterialPicker({ onSelect }: MaterialPickerProps) {
  const [search, setSearch] = useState('')
  const { data: materials, isLoading } = useMaterials(search)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Sök material..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="outline" size="sm" type="button">
          <Search size={16} />
        </Button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Laddar...</p>}

      {materials && materials.length > 0 && (
        <div className="max-h-64 overflow-y-auto border rounded-md">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="flex-1">
                <div className="font-medium">{material.name}</div>
                {material.sku && <div className="text-sm text-gray-500">SKU: {material.sku}</div>}
                {material.category && <div className="text-sm text-gray-500">{material.category}</div>}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-medium">{material.price.toLocaleString('sv-SE')} kr</div>
                  <div className="text-sm text-gray-500">per {material.unit}</div>
                </div>
                <Button size="sm" onClick={() => onSelect(material)}>
                  Välj
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {materials && materials.length === 0 && !isLoading && (
        <p className="text-sm text-gray-500 text-center py-4">Inga material hittades</p>
      )}
    </div>
  )
}

