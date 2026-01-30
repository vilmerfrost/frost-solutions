'use client'

import { motion } from 'framer-motion'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep
        
        return (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`
              w-2.5 h-2.5 rounded-full transition-all duration-300
              ${isActive 
                ? 'w-8 bg-white' 
                : isCompleted 
                  ? 'bg-white/80' 
                  : 'bg-white/30'
              }
            `}
          />
        )
      })}
    </div>
  )
}
