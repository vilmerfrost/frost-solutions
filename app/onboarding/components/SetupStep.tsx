'use client'

import { motion } from 'framer-motion'
import { Sparkles, FolderOpen, Loader2, ArrowLeft } from 'lucide-react'
import { fadeInVariants, staggerContainerVariants, staggerItemVariants } from '../animations/variants'

interface SetupStepProps {
  onChooseDemo: () => void
  onChooseEmpty: () => void
  onBack: () => void
  isLoading: boolean
}

export function SetupStep({
  onChooseDemo,
  onChooseEmpty,
  onBack,
  isLoading,
}: SetupStepProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
    >
      {/* Title */}
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-white mb-3 text-center"
        variants={fadeInVariants}
      >
        Hur vill du börja?
      </motion.h2>
      
      <motion.p
        className="text-lg text-white/70 mb-10 text-center max-w-md"
        variants={fadeInVariants}
      >
        Du kan alltid ändra detta senare
      </motion.p>

      {/* Options */}
      <motion.div
        className="w-full max-w-md space-y-4"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Demo Option */}
        <motion.button
          variants={staggerItemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onChooseDemo}
          disabled={isLoading}
          className="w-full p-5 rounded-xl bg-white text-left transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Utforska med demo-data</div>
              <div className="text-sm text-gray-500">Se hur appen fungerar med exempeldata</div>
            </div>
          </div>
          
          {isLoading && (
            <div className="mt-3 flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Skapar demo-data...</span>
            </div>
          )}
        </motion.button>

        {/* Empty Option */}
        <motion.button
          variants={staggerItemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onChooseEmpty}
          disabled={isLoading}
          className="w-full p-5 rounded-xl bg-white/10 border border-white/20 text-left transition-all duration-200 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-6 h-6 text-white/70" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Börja tomt</div>
              <div className="text-sm text-white/60">Lägg till kunder och projekt själv</div>
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* Back button */}
      <motion.button
        variants={fadeInVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        disabled={isLoading}
        className="mt-8 px-5 py-2.5 rounded-lg text-white/70 font-medium hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka
      </motion.button>
    </motion.div>
  )
}
