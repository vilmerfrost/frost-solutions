type WorkTypeSelectorProps = {
 value: string,
 onChange: (type: string) => void
}
const options = [
 { id: 'work', label: 'Arbete', color: 'blue' },
 { id: 'evening', label: 'OB Kväll', color: 'purple' },
 { id: 'night', label: 'OB Natt', color: 'indigo' },
 { id: 'weekend', label: 'OB Helg', color: 'pink' },
 { id: 'vacation', label: 'Semester', color: 'green' },
 { id: 'sick', label: 'Sjuk', color: 'yellow' },
 { id: 'vabb', label: 'VAB', color: 'orange' },
 { id: 'absence', label: 'Frånvaro', color: 'gray' }
]

export default function WorkTypeSelector({ value, onChange }: WorkTypeSelectorProps) {
 return (
  <div className="mb-6">
   <label className="block text-sm font-semibold text-gray-700 mb-3">Typ av tidrapport</label>
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {options.map(opt => {
     const isActive = value === opt.id
     const colorClasses = {
      blue: isActive ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      purple: isActive ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-purple-50 text-primary-500 border-primary-200 hover:bg-purple-100',
      indigo: isActive ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100',
      pink: isActive ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-pink-50 text-primary-500 border-primary-200 hover:bg-pink-100',
      green: isActive ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      yellow: isActive ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100',
      orange: isActive ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
      gray: isActive ? 'bg-gray-500 hover:bg-gray-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
     }
     return (
      <button
       key={opt.id}
       type="button"
       className={`px-4 py-3 rounded-[8px] border-2 font-semibold transition-all ${colorClasses[opt.color as keyof typeof colorClasses]}`}
       onClick={() => onChange(opt.id)}
      >{opt.label}</button>
     )
    })}
   </div>
  </div>
 )
}
