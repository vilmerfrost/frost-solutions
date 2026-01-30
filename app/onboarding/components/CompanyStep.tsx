'use client'

import { motion } from 'framer-motion'
import { Building, ArrowLeft, Loader2 } from 'lucide-react'
import { fadeInVariants, staggerContainerVariants, staggerItemVariants } from '../animations/variants'

interface CompanyStepProps {
  companyName: string
  orgNumber: string
  onCompanyNameChange: (value: string) => void
  onOrgNumberChange: (value: string) => void
  onContinue: () => void
  onBack: () => void
  isLoading: boolean
  error: string | null
}

export function CompanyStep({
  companyName,
  orgNumber,
  onCompanyNameChange,
  onOrgNumberChange,
  onContinue,
  onBack,
  isLoading,
  error,
}: CompanyStepProps) {
  const isValid = companyName.trim().length > 0
  
  const formatOrgNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as XXXXXX-XXXX
    if (digits.length <= 6) {
      return digits
    }
    return `${digits.slice(0, 6)}-${digits.slice(6, 10)}`
  }
  
  const handleOrgNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatOrgNumber(e.target.value)
    onOrgNumberChange(formatted)
  }
  
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20"
      >
        <Building className="w-10 h-10 text-white" />
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-white mb-3 text-center"
        variants={fadeInVariants}
      >
        Ditt företag
      </motion.h2>
      
      <motion.p
        className="text-lg text-white/70 mb-10 text-center max-w-md"
        variants={fadeInVariants}
      >
        Berätta lite om din verksamhet
      </motion.p>

      {/* Form */}
      <motion.div
        className="w-full max-w-md space-y-6"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Company Name */}
        <motion.div variants={staggerItemVariants}>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Företagsnamn *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Mitt Byggföretag AB"
            className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg"
            autoFocus
          />
        </motion.div>

        {/* Org Number */}
        <motion.div variants={staggerItemVariants}>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Organisationsnummer <span className="text-white/50">(valfritt)</span>
          </label>
          <input
            type="text"
            value={orgNumber}
            onChange={handleOrgNumberChange}
            placeholder="556677-8899"
            maxLength={11}
            className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg font-mono"
          />
          <p className="mt-2 text-sm text-white/50">
            Du kan lägga till detta senare i inställningar
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
