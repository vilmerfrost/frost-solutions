'use client'

import { motion } from 'framer-motion'
import { FolderKanban, ArrowLeft, Loader2 } from 'lucide-react'
import { fadeInVariants, staggerContainerVariants, staggerItemVariants } from '../animations/variants'

interface ProjectStepProps {
  projectName: string
  projectSiteAddress: string
  projectBudget: string
  projectRate: string
  onProjectNameChange: (value: string) => void
  onProjectSiteAddressChange: (value: string) => void
  onProjectBudgetChange: (value: string) => void
  onProjectRateChange: (value: string) => void
  onContinue: () => void
  onBack: () => void
  isLoading: boolean
  error: string | null
}

export function ProjectStep({
  projectName,
  projectSiteAddress,
  projectBudget,
  projectRate,
  onProjectNameChange,
  onProjectSiteAddressChange,
  onProjectBudgetChange,
  onProjectRateChange,
  onContinue,
  onBack,
  isLoading,
  error,
}: ProjectStepProps) {
  const isValid = projectName.trim().length > 0
  
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
        <FolderKanban className="w-10 h-10 text-white" />
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-white mb-3 text-center"
        variants={fadeInVariants}
      >
        Ditt första projekt
      </motion.h2>
      
      <motion.p
        className="text-lg text-white/70 mb-8 text-center max-w-md"
        variants={fadeInVariants}
      >
        Skapa ett projekt för att börja tidrapportera
      </motion.p>

      {/* Form */}
      <motion.div
        className="w-full max-w-md space-y-4"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Project Name */}
        <motion.div variants={staggerItemVariants}>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Projektnamn *
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Renovering Kök Storgatan 4"
            className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg"
            autoFocus
          />
        </motion.div>

        {/* Site Address */}
        <motion.div variants={staggerItemVariants}>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Objektsadress <span className="text-white/50">(var jobbet utförs)</span>
          </label>
          <input
            type="text"
            value={projectSiteAddress}
            onChange={(e) => onProjectSiteAddressChange(e.target.value)}
            placeholder="Storgatan 4, 123 45 Stockholm"
            className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg"
          />
        </motion.div>

        {/* Budget and Rate */}
        <motion.div variants={staggerItemVariants} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Budget (timmar)
            </label>
            <input
              type="number"
              value={projectBudget}
              onChange={(e) => onProjectBudgetChange(e.target.value)}
              placeholder="100"
              min="0"
              className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Timpris (SEK)
            </label>
            <input
              type="number"
              value={projectRate}
              onChange={(e) => onProjectRateChange(e.target.value)}
              placeholder="360"
              min="0"
              className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 text-lg"
            />
          </div>
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
                Skapar...
              </>
            ) : (
              'Slutför'
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
