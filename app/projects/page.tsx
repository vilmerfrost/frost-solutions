import { Suspense } from 'react'
import ProjectsContent from './ProjectsContent'

export default function ProjectsPage() {
 return (
  <Suspense fallback={
   <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-gray-500">Laddar...</div>
   </div>
  }>
   <ProjectsContent />
  </Suspense>
 )
}
