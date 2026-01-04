// app/components/forms/TimeRangePicker.tsx
'use client'

import React from 'react'
import { TimeInput } from '@/components/ui/time-input'

interface TimeRangePickerProps {
 startLabel?: string
 endLabel?: string
 startValue: string
 endValue: string
 onStartChange: (value: string) => void
 onEndChange: (value: string) => void
 startError?: string
 endError?: string
 required?: boolean
}

export function TimeRangePicker({
 startLabel = 'Start',
 endLabel = 'Slut',
 startValue,
 endValue,
 onStartChange,
 onEndChange,
 startError,
 endError,
 required,
}: TimeRangePickerProps) {
 return (
  <div className="grid grid-cols-2 gap-4">
   <TimeInput
    label={startLabel}
    value={startValue}
    onChange={(e) => onStartChange(e.target.value)}
    error={startError}
    required={required}
   />
   <TimeInput
    label={endLabel}
    value={endValue}
    onChange={(e) => onEndChange(e.target.value)}
    error={endError}
    required={required}
   />
  </div>
 )
}

