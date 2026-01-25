import Link from 'next/link'

export function LegalFooter() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Användarvillkor
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Integritetspolicy
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/dpa" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            DPA
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/sla" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            SLA
          </Link>
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} Frost Data AB. Alla rättigheter förbehållna.
        </div>
      </div>
    </footer>
  )
}
