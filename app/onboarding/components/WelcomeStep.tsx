'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { fadeInVariants, staggerContainerVariants, staggerItemVariants, logoVariants } from '../animations/variants'

interface WelcomeStepProps {
  companyName: string
  onCompanyNameChange: (value: string) => void
  onContinue: () => void
  isLoading: boolean
  error: string | null
}

export function WelcomeStep({ 
  companyName, 
  onCompanyNameChange, 
  onContinue,
  isLoading,
  error,
}: WelcomeStepProps) {
  const isValid = companyName.trim().length > 0

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
    >
      {/* Logo */}
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        className="mb-8"
      >
        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10 text-white"
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
        className="text-3xl md:text-4xl font-bold text-white mb-3"
        variants={fadeInVariants}
      >
        Välkommen till Frost
      </motion.h1>
      
      <motion.p
        className="text-lg text-white/70 mb-10 max-w-md"
        variants={fadeInVariants}
      >
        Kom igång på under en minut
      </motion.p>

      {/* Form */}
      <motion.div
        className="w-full max-w-sm space-y-6"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItemVariants}>
          <label className="block text-sm font-medium text-white/80 mb-2 text-left">
            Företagsnamn
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Mitt Företag AB"
            className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid && !isLoading) {
                onContinue()
              }
            }}
          />
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Continue Button */}
        <motion.button
          variants={staggerItemVariants}
          whileHover={isValid && !isLoading ? { scale: 1.02 } : {}}
          whileTap={isValid && !isLoading ? { scale: 0.98 } : {}}
          onClick={onContinue}
          disabled={!isValid || isLoading}
          className={`
            w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200
            flex items-center justify-center gap-2
            ${isValid && !isLoading
              ? 'bg-white text-gray-900 shadow-lg shadow-white/20 hover:shadow-xl'
              : 'bg-white/20 text-white/50 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Skapar konto...
            </>
          ) : (
            'Fortsätt'
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
