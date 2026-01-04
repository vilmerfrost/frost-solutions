// app/components/time/OBTypeSelector.tsx
'use client'

import React from 'react'

export type OBType = 'work' | 'ob-evening' | 'ob-night' | 'ob-weekend' | 'sick' | 'vab' | 'vacation' | 'absence'

interface OBTypeOption {
 id: OBType
 icon: string
 label: string
}

const obTypes: OBTypeOption[] = [
 { id: 'work', icon: '🔨', label: 'Arbete' },
 { id: 'ob-evening', icon: '🌙', label: 'OB Kväll' },
 { id: 'ob-night', icon: '🌃', label: 'OB Natt' },
 { id: 'ob-weekend', icon: '🎉', label: 'OB Helg' },
 { id: 'sick', icon: '🏥', label: 'Sjuk' },
 { id: 'vab', icon: '🏖️', label: 'VAB' },
 { id: 'vacation', icon: '🌧️', label: 'Semester' },
 { id: 'absence', icon: '🏠', label: 'Frånvaro' },
]

interface OBTypeSelectorProps {
 value: OBType
 onChange: (value: OBType) => void
 label?: string
 required?: boolean
}

export function OBTypeSelector({ value, onChange, label, required }: OBTypeSelectorProps) {
 return (
  <div className="w-full">
   {label && (
    <label className="block text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-3">
     {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
   )}
   
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {obTypes.map((type) => {
     const isSelected = value === type.id
     
     return (
      <button
       key={type.id}
       type="button"
       onClick={() => onChange(type.id)}
       className={`
        flex flex-col items-center justify-center gap-2
        w-full aspect-square rounded-[8px] border-2 transition-all duration-150
        ${
         isSelected
          ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400'
          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
        }
       `}
      >
       <span className="text-[32px]" aria-hidden="true">
        {type.icon}
       </span>
       <span className={`text-[12px] font-medium ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
        {type.label}
       </span>
      </button>
     )
    })}
   </div>
  </div>
 )
}

