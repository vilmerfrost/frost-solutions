'use client'

import { motion } from 'framer-motion'
import { Sparkles, FileText, ArrowLeft, Loader2 } from 'lucide-react'
import { fadeInVariants, staggerContainerVariants, staggerItemVariants } from '../animations/variants'

interface DemoChoiceStepProps {
  onChooseDemo: () => void
  onChooseScratch: () => void
  onBack: () => void
  isLoading: boolean
}

export function DemoChoiceStep({
  onChooseDemo,
  onChooseScratch,
  onBack,
  isLoading,
}: DemoChoiceStepProps) {
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
        Hur vill du komma igång?
      </motion.h2>
      
      <motion.p
        className="text-lg text-white/70 mb-10 text-center max-w-md"
        variants={fadeInVariants}
      >
        Välj det alternativ som passar dig bäst
      </motion.p>

      {/* Options */}
      <motion.div
        className="w-full max-w-lg space-y-4"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Demo Option */}
        <motion.button
          variants={staggerItemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onChooseDemo}
          disabled={isLoading}
          className="w-full p-6 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-400/30 hover:border-purple-400/60 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/40 transition-colors">
              <Sparkles className="w-7 h-7 text-purple-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                Utforska med demo-data
                <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full">
                  Rekommenderat
                </span>
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Se hur appen fungerar med färdiga projekt, fakturor och tidrapporter. 
                Perfekt om du vill utforska alla funktioner först.
              </p>
            </div>
          </div>
          
          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Skapar demo-data...</span>
            </div>
          )}
        </motion.button>

        {/* Scratch Option */}
        <motion.button
          variants={staggerItemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onChooseScratch}
          disabled={isLoading}
          className="w-full p-6 rounded-2xl bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <FileText className="w-7 h-7 text-white/70" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">
                Börja från scratch
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Skapa din första kund och ditt första projekt nu. 
                Bäst om du redan har ett jobb du vill lägga in.
              </p>
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
        className="mt-8 px-6 py-3 rounded-xl bg-white/10 text-white/80 font-medium border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka
      </motion.button>
    </motion.div>
  )
}
