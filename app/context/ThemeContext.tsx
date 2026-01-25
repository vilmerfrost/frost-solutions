'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
 theme: Theme
 toggleTheme: () => void
 setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
 const [theme, setThemeState] = useState<Theme>('light')
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
  setMounted(true)
  // Kolla localStorage först, default till 'light' (ignorera system preference)
  const savedTheme = localStorage.getItem('theme') as Theme | null
  
  // Always default to light mode if no saved preference
  const initialTheme = savedTheme || 'light'
  setThemeState(initialTheme)
  applyTheme(initialTheme)
 }, [])

 const applyTheme = (newTheme: Theme) => {
  const root = document.documentElement
  if (newTheme === 'dark') {
   root.classList.add('dark')
  } else {
   root.classList.remove('dark')
  }
 }

 const setTheme = (newTheme: Theme) => {
  setThemeState(newTheme)
  localStorage.setItem('theme', newTheme)
  applyTheme(newTheme)
 }

 const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
 }

 // During SSR or before mounted, provide default theme to prevent errors
 const contextValue = mounted ? { theme, toggleTheme, setTheme } : { theme: 'light' as Theme, toggleTheme: () => {}, setTheme: () => {} }
 
 return (
  <ThemeContext.Provider value={contextValue}>
   {children}
  </ThemeContext.Provider>
 )
}

export const useTheme = () => {
 const context = useContext(ThemeContext)
 if (!context) {
  // Return default values instead of throwing during SSR
  return { theme: 'light' as Theme, toggleTheme: () => {}, setTheme: () => {} }
 }
 return context
}

