import { useEffect } from 'react'

type EmployeeSelectorProps = {
 value: string,
 onChange: (val: string) => void,
 dynamicEmployees?: { id: string, name: string }[],
 disabled?: boolean,
 lockedEmployeeId?: string | null
}

export default function EmployeeSelector({ value, onChange, dynamicEmployees = [], disabled = false, lockedEmployeeId }: EmployeeSelectorProps) {
 // Om lockedEmployeeId finns, filtrera bara den anställden
 const availableEmployees = lockedEmployeeId 
  ? dynamicEmployees.filter(e => e.id === lockedEmployeeId)
  : dynamicEmployees
 
 // Om lockedEmployeeId finns och value är tom, sätt automatiskt
 useEffect(() => {
  if (lockedEmployeeId && !value && availableEmployees.length > 0) {
   onChange(lockedEmployeeId)
  }
 }, [lockedEmployeeId, value, availableEmployees, onChange])
 
 return (
  <div>
   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
    Anställd
    {disabled && lockedEmployeeId && (
     <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Låst till din användare)</span>
    )}
   </label>
   <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className={`w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600 ${
     disabled ? 'opacity-60 cursor-not-allowed' : ''
    }`}
   >
    <option value="">Välj anställd</option>
    {availableEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
   </select>
  </div>
 )
}
