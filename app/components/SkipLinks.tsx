// app/components/SkipLinks.tsx
'use client'

/**
 * Skip links for keyboard navigation accessibility.
 * Allows users to skip directly to main content or navigation.
 * These links are only visible when focused via keyboard.
 */
export function SkipLinks() {
 return (
  <div className="sr-only focus-within:not-sr-only">
   <a
    href="#main-content"
    className="
     fixed top-0 left-0 z-[100] 
     bg-primary-500 text-white 
     px-4 py-2 m-2 rounded-md
     font-medium text-sm
     focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white
     transform -translate-y-full focus:translate-y-0
     transition-transform
    "
   >
    Hoppa till huvudinnehåll
   </a>
   <a
    href="#main-navigation"
    className="
     fixed top-0 left-48 z-[100]
     bg-gray-700 text-white
     px-4 py-2 m-2 rounded-md
     font-medium text-sm
     focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white
     transform -translate-y-full focus:translate-y-0
     transition-transform
    "
   >
    Hoppa till navigering
   </a>
  </div>
 )
}
