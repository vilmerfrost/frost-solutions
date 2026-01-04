'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedStatProps {
 label: string
 value: number
 suffix?: string
 gradient?: string
 delay?: number
}

export default function AnimatedStat({ 
 label, 
 value, 
 suffix = '', 
 gradient = ' ',
 delay = 0
}: AnimatedStatProps) {
 const [displayValue, setDisplayValue] = useState(0)
 const [isVisible, setIsVisible] = useState(false)
 const ref = useRef<HTMLDivElement>(null)

 useEffect(() => {
  const observer = new IntersectionObserver(
   ([entry]) => {
    if (entry.isIntersecting && !isVisible) {
     setIsVisible(true)
    }
   },
   { threshold: 0.1 }
  )

  if (ref.current) {
   observer.observe(ref.current)
  }

  return () => {
   if (ref.current) {
    observer.unobserve(ref.current)
   }
  }
 }, [isVisible])

 useEffect(() => {
  if (!isVisible) return

  const duration = 1500
  const steps = 60
  const stepValue = value / steps
  const stepDuration = duration / steps
  let currentStep = 0

  const timer = setTimeout(() => {
   const interval = setInterval(() => {
    currentStep++
    const nextValue = Math.min(stepValue * currentStep, value)
    setDisplayValue(Math.floor(nextValue))

    if (currentStep >= steps) {
     clearInterval(interval)
     setDisplayValue(value)
    }
   }, stepDuration)

   return () => clearInterval(interval)
  }, delay)

  return () => clearTimeout(timer)
 }, [isVisible, value, delay])

   return (
    <div ref={ref} className="bg-gray-50 dark:bg-gray-900 rounded-[8px] sm:rounded-[8px] shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-105">
     <div className={`text-2xl sm:text-3xl font-semibold mb-1 text-gray-900 dark:text-white`}>
      {displayValue.toLocaleString('sv-SE')}{suffix}
     </div>
     <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
   )
}

