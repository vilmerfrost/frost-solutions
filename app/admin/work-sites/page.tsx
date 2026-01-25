import { requireAdmin } from '@/lib/auth/requireAdmin'
import Sidebar from '@/components/Sidebar'
import WorkSitesClient from './WorkSitesClient'

// SECURITY: Server-side auth check before rendering admin page
export default async function WorkSitesPage() {
  const adminAuth = await requireAdmin()
  
  // If not admin, show access denied
  if (!adminAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 p-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-[8px] p-6 border border-red-200 dark:border-red-800">
              <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">
                Åtkomst nekad
              </h2>
              <p className="text-red-700 dark:text-red-300">
                Endast administratörer kan hantera arbetsplatser.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  return <WorkSitesClient tenantId={adminAuth.tenantId} />
}
