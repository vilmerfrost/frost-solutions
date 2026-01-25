'use client'

import Link from 'next/link'

interface TermsCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  required?: boolean
  variant?: 'signup' | 'checkout'
}

export function TermsCheckbox({ 
  checked, 
  onChange, 
  required = true,
  variant = 'signup' 
}: TermsCheckboxProps) {
  const text = variant === 'signup' 
    ? 'Jag har läst och accepterar'
    : 'Genom att slutföra köpet accepterar du våra'

  return (
    <div className="flex items-start space-x-2">
      <input
        type="checkbox"
        id="terms-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
      />
      <label 
        htmlFor="terms-checkbox" 
        className="text-sm text-gray-700 dark:text-gray-300"
      >
        {text}{' '}
        <Link 
          href="/terms" 
          target="_blank"
          className="text-blue-600 hover:text-blue-700 underline dark:text-blue-400 dark:hover:text-blue-500"
        >
          användarvillkoren
        </Link>
        {' '}och{' '}
        <Link 
          href="/privacy" 
          target="_blank"
          className="text-blue-600 hover:text-blue-700 underline dark:text-blue-400 dark:hover:text-blue-500"
        >
          integritetspolicyn
        </Link>
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  )
}
