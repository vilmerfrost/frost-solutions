'use client'

import { motion } from 'framer-motion'
import { Building2, Wrench, Zap, Paintbrush, Hammer, Package } from 'lucide-react'
import { Industry, OnboardingActions } from '../hooks/useOnboardingState'
import { 
  fadeInVariants, 
  staggerContainerVariants, 
  staggerItemVariants,
  logoVariants 
} from '../animations/variants'

interface WelcomeStepProps {
  selectedIndustry: Industry | null
  onSelect: (industry: Industry) => void
  onContinue: () => void
  actions: OnboardingActions
}

const industries: { id: Industry; label: string; icon: React.ElementType }[] = [
  { id: 'bygg', label: 'Bygg', icon: Building2 },
  { id: 'vvs', label: 'VVS', icon: Wrench },
  { id: 'el', label: 'El', icon: Zap },
  { id: 'maleri', label: 'Måleri', icon: Paintbrush },
  { id: 'snickeri', label: 'Snickeri', icon: Hammer },
  { id: 'ovrigt', label: 'Annat', icon: Package },
]

export function WelcomeStep({ selectedIndustry, onSelect, onContinue, actions }: WelcomeStepProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
    >
      {/* Animated Logo */}
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        className="mb-8"
      >
        <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
          <svg
            viewBox="0 0 24 24"
            className="w-14 h-14 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-4xl md:text-5xl font-bold text-white mb-4"
        variants={fadeInVariants}
      >
        Välkommen till Frost
      </motion.h1>
      
      <motion.p
        className="text-xl text-white/80 mb-12 max-w-md"
        variants={fadeInVariants}
      >
        Låt oss komma igång! Vilken bransch jobbar du inom?
      </motion.p>

      {/* Industry Selection Grid */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-10 w-full max-w-md"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {industries.map((industry) => {
          const Icon = industry.icon
          const isSelected = selectedIndustry === industry.id
          
          return (
            <motion.button
              key={industry.id}
              variants={staggerItemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(industry.id)}
              className={`
                relative p-4 rounded-2xl border-2 transition-all duration-200
                flex flex-col items-center gap-2
                ${isSelected 
                  ? 'bg-white text-gray-900 border-white shadow-lg shadow-white/20' 
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40'
                }
              `}
            >
              <Icon className={`w-8 h-8 ${isSelected ? 'text-primary-500' : ''}`} />
              <span className="text-sm font-medium">{industry.label}</span>
              
              {isSelected && (
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Continue Button */}
      <motion.button
        variants={fadeInVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        disabled={!selectedIndustry}
        className={`
          px-10 py-4 rounded-full font-semibold text-lg transition-all duration-200
          ${selectedIndustry
            ? 'bg-white text-gray-900 shadow-lg shadow-white/20 hover:shadow-xl'
            : 'bg-white/20 text-white/50 cursor-not-allowed'
          }
        `}
      >
        Fortsätt
      </motion.button>
    </motion.div>
  )
}
