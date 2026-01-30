'use client'

import { motion } from 'framer-motion'
import { User, ArrowLeft, Loader2 } from 'lucide-react'
import { fadeInVariants, staggerContainerVariants, staggerItemVariants } from '../animations/variants'

interface ProfileStepProps {
  adminName: string
  adminEmail: string
  adminBaseRate: string
  onAdminNameChange: (value: string) => void
  onAdminEmailChange: (value: string) => void
  onAdminBaseRateChange: (value: string) => void
  onContinue: () => void
  onBack: () => void
  isLoading: boolean
  error: string | null
}

export function ProfileStep({
  adminName,
  adminEmail,
  adminBaseRate,
  onAdminNameChange,
  onAdminEmailChange,
  onAdminBaseRateChange,
  onContinue,
  onBack,
  isLoading,
  error,
}: ProfileStepProps) {
  const isValid = adminName.trim().length > 0
  
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20"
      >
        <User className="w-10 h-10 text-white" />
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-white mb-3 text-center"
        variants={fadeInVariants}
      >
        Din profil
      </motion.h2>
      
      <motion.p
        className="text-lg text-white/70 mb-10 text-center max-w-md"
        variants={fadeInVariants}
      >
        Berätta lite om dig själv
      </motion.p>

      {/* Form */}
      <motion.div
        className="w-full max-w-md space-y-5"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Name */}
        <motion.div variants={staggerItemVariants}>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Ditt namn *
          </label>
          <input
            type="text"
            value={adminName}
            onChange={(e) => onAdminNameChange(e.target.value)}
            placeholder="Anna Andersson"
            className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg"
            autoFocus
          />
        </motion.div>

        {/* Email */}
        <motion.div variants={staggerItemVariants}>
          <label className="block text-sm font-medium text-white/80 mb-2">
            E-post <span className="text-white/50">(för notifikationer)</span>
          </label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => onAdminEmailChange(e.target.value)}
            placeholder="anna@foretag.se"
            className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg"
          />
        </motion.div>

        {/* Hourly Rate */}
        <motion.div variants={staggerItemVariants}>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Timpris (SEK) <span className="text-white/50">(för fakturering)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={adminBaseRate}
              onChange={(e) => onAdminBaseRateChange(e.target.value)}
              placeholder="360"
              min="0"
              className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">
              kr/tim
            </span>
          </div>
          <p className="mt-2 text-sm text-white/50">
            Standard timpris som används i nya projekt
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Buttons */}
        <motion.div 
          className="flex gap-4 pt-4"
          variants={staggerItemVariants}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white font-medium border-2 border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Tillbaka
          </motion.button>
          
          <motion.button
            whileHover={isValid && !isLoading ? { scale: 1.02 } : {}}
            whileTap={isValid && !isLoading ? { scale: 0.98 } : {}}
            onClick={onContinue}
            disabled={!isValid || isLoading}
            className={`
              flex-1 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200
              flex items-center justify-center gap-2
              ${isValid && !isLoading
                ? 'bg-white text-gray-900 shadow-lg hover:shadow-xl'
                : 'bg-white/20 text-white/50 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sparar...
              </>
            ) : (
              'Fortsätt'
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
