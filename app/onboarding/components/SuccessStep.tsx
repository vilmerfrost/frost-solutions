'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { fadeInVariants, celebrationVariants } from '../animations/variants'

interface SuccessStepProps {
  onGoToDashboard: () => void
  usedDemo: boolean
}

export function SuccessStep({ onGoToDashboard, usedDemo }: SuccessStepProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
    >
      {/* Success Icon */}
      <motion.div
        variants={celebrationVariants}
        initial="initial"
        animate="animate"
        className="mb-8"
      >
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-3xl md:text-4xl font-bold text-white mb-3"
        variants={fadeInVariants}
      >
        Du är redo!
      </motion.h2>
      
      <motion.p
        className="text-lg text-white/70 mb-2 max-w-md"
        variants={fadeInVariants}
      >
        Ditt konto har skapats
      </motion.p>

      {usedDemo && (
        <motion.p
          variants={fadeInVariants}
          className="text-white/60 text-sm mb-8"
        >
          Demo-data har lagts till så du kan utforska direkt
        </motion.p>
      )}

      {!usedDemo && (
        <motion.p
          variants={fadeInVariants}
          className="text-white/60 text-sm mb-8"
        >
          Börja med att skapa din första kund eller projekt
        </motion.p>
      )}

      {/* Dashboard Button */}
      <motion.button
        variants={fadeInVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGoToDashboard}
        className="px-8 py-4 rounded-xl bg-white text-gray-900 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
      >
        Gå till Dashboard
        <ArrowRight className="w-5 h-5" />
      </motion.button>

      {/* Tip */}
      <motion.p
        variants={fadeInVariants}
        className="mt-8 text-white/50 text-sm"
      >
        Tips: Klicka på ? i menyn för hjälp och guider
      </motion.p>
    </motion.div>
  )
}
