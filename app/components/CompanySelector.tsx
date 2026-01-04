type CompanySelectorProps = {
 value: string,
 onChange: (val: string) => void,
 dynamicProjects?: { id: string, name: string }[]
}

export default function CompanySelector({ value, onChange, dynamicProjects = [] }: CompanySelectorProps) {
 return (
  <div>
   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Projekt</label>
   <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
   >
    <option value="">Välj projekt</option>
    {dynamicProjects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
   </select>
  </div>
 )
}
