'use client'

import { motion } from 'framer-motion'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100
  
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Progress bar */}
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      {/* Step text */}
      <div className="flex justify-between items-center text-sm text-white/70">
        <span>Steg {currentStep} av {totalSteps}</span>
        <span>{Math.round(progress)}% klart</span>
      </div>
    </div>
  )
}
