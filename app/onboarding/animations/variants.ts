import { Variants } from 'framer-motion'

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 50,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Fade in variants
export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

// Stagger children variants
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

// Scale up variants for cards/buttons
export const scaleUpVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

// Logo animation variants
export const logoVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.5,
    rotate: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1], // Spring-like
    },
  },
}

// Button hover variants
export const buttonHoverVariants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  tap: {
    scale: 0.98,
  },
}

// Card selection variants
export const cardSelectionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  selected: {
    scale: 1.02,
    borderColor: 'var(--primary-500)',
    transition: {
      duration: 0.2,
    },
  },
}

// Progress bar variants
export const progressBarVariants: Variants = {
  initial: {
    width: '0%',
  },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
}

// Success celebration variants
export const celebrationVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
}

// Gradient backgrounds for each step
export const stepGradients: Record<string, string> = {
  welcome: 'from-purple-600 via-blue-600 to-blue-500',
  company: 'from-blue-600 via-cyan-500 to-cyan-400',
  profile: 'from-cyan-500 via-teal-500 to-green-500',
  'demo-choice': 'from-gray-700 via-gray-600 to-gray-500',
  customer: 'from-green-500 via-emerald-500 to-yellow-500',
  project: 'from-yellow-500 via-orange-500 to-orange-400',
  success: 'from-amber-400 via-yellow-500 to-yellow-300',
}
