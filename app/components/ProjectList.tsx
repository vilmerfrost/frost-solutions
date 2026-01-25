import ProjectCard from './ProjectCard'
import Link from 'next/link'

type ProjectType = {
 id: string
 name: string
 budget: number
 hours: number
}

type Props = {
 projects: ProjectType[]
}

export default function ProjectList({ projects }: Props) {
 const showAll = projects.length > 3
 return (
  <section>
   <h2 className="font-semibold mb-3">Projektöversikt</h2>
   <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
    {projects.slice(0, 3).map(p => <ProjectCard key={p.id} project={p} />)}
   </div>
   {showAll && (
    <div className="mt-4 flex justify-end">
     <Link href="/projects" className="text-blue-600 underline font-semibold px-4 py-2">
      Visa alla projekt
     </Link>
    </div>
   )}
  </section>
 )
}
