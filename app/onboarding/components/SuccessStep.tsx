'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, Clock, FileText, GraduationCap, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { fadeInVariants, staggerContainerVariants, staggerItemVariants, celebrationVariants } from '../animations/variants'

interface SuccessStepProps {
  onGoToDashboard: () => void
  onReportTime: () => void
  onCreateInvoice: () => void
  onStartTour: () => void
  usedDemo: boolean
}

const quickActions = [
  {
    id: 'dashboard',
    label: 'Gå till Dashboard',
    description: 'Se din översikt',
    icon: LayoutDashboard,
    primary: true,
  },
  {
    id: 'time',
    label: 'Rapportera tid',
    description: 'Logga din första timme',
    icon: Clock,
    primary: false,
  },
  {
    id: 'invoice',
    label: 'Skapa faktura',
    description: 'Fakturera en kund',
    icon: FileText,
    primary: false,
  },
  {
    id: 'tour',
    label: 'Ta rundturen',
    description: 'Lär dig alla funktioner',
    icon: GraduationCap,
    primary: false,
  },
]

export function SuccessStep({
  onGoToDashboard,
  onReportTime,
  onCreateInvoice,
  onStartTour,
  usedDemo,
}: SuccessStepProps) {
  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  const handleAction = (id: string) => {
    switch (id) {
      case 'dashboard':
        onGoToDashboard()
        break
      case 'time':
        onReportTime()
        break
      case 'invoice':
        onCreateInvoice()
        break
      case 'tour':
        onStartTour()
        break
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
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
        <div className="relative">
          <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 w-28 h-28 bg-green-400/30 rounded-full blur-xl -z-10" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-4xl md:text-5xl font-bold text-white mb-4 text-center"
        variants={fadeInVariants}
      >
        Allt klart!
      </motion.h2>
      
      <motion.p
        className="text-xl text-white/80 mb-4 text-center max-w-md"
        variants={fadeInVariants}
      >
        Ditt konto är redo att användas
      </motion.p>

      {usedDemo && (
        <motion.div
          variants={fadeInVariants}
          className="mb-8 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-400/30"
        >
          <span className="text-purple-200 text-sm">
            Demo-data har lagts till i ditt konto
          </span>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        className="w-full max-w-md space-y-3 mb-8"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {quickActions.map((action) => {
          const Icon = action.icon
          
          return (
            <motion.button
              key={action.id}
              variants={staggerItemVariants}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction(action.id)}
              className={`
                w-full p-4 rounded-xl text-left transition-all duration-200
                flex items-center gap-4
                ${action.primary
                  ? 'bg-white text-gray-900 shadow-lg hover:shadow-xl'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${action.primary ? 'bg-primary-100' : 'bg-white/10'}
              `}>
                <Icon className={`w-6 h-6 ${action.primary ? 'text-primary-500' : 'text-white/70'}`} />
              </div>
              <div>
                <div className={`font-semibold ${action.primary ? 'text-gray-900' : 'text-white'}`}>
                  {action.label}
                </div>
                <div className={`text-sm ${action.primary ? 'text-gray-500' : 'text-white/60'}`}>
                  {action.description}
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Trial info */}
      <motion.div
        variants={fadeInVariants}
        className="text-center text-white/60 text-sm"
      >
        <p>Du har 30 dagars gratis provperiod.</p>
        <p>Inga kortuppgifter krävs.</p>
      </motion.div>
    </motion.div>
  )
}
