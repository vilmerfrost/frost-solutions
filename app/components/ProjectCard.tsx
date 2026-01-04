type ProjectType = {
 id: string
 name: string
 budget: number
 hours: number
}

export default function ProjectCard({ project }: { project: ProjectType }) {
 return (
  <div className="bg-white rounded-lg p-3 shadow flex flex-col">
   <div className="font-semibold mb-1">{project.name}</div>
   <div className="flex items-center mb-1">
    <span className="text-xs text-blue-400 mr-2">{project.hours ?? 0}/{project.budget ?? 0}h</span>
    <span className="ml-auto text-xs font-bold text-blue-600">
     {project.budget > 0 ? Math.round((project.hours/project.budget)*100) : 0}%
    </span>
   </div>
   <div className="w-full bg-blue-200/30 rounded h-4 mt-2">
    <div
     style={{ width: `${project.budget ? (project.hours/project.budget)*100 : 0}%` }}
     className="h-4 rounded bg-primary-500 hover:bg-primary-600 shadow-inner transition-all"
    ></div>
   </div>
   <a
    href={`/projects/${project.id}`}
    className="mt-2 bg-frost-blue text-white rounded px-4 py-1 text-sm self-end"
   >
    Öppna
   </a>
  </div>
 )
}
