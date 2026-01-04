type EmployeeType = {
 id: string
 name: string
 role: string
}

export default function EmployeeList({ employees }: { employees: EmployeeType[] }) {
 return (
  <section>
   <h2 className="font-semibold mb-3">Anställda</h2>
   <div className="flex flex-col gap-2">
    {employees.map(e => (
     <a
      key={e.id}
      href={`/payroll/employeeID/${e.id}`}
      className="flex justify-between items-center px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 hover:underline hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 ease-in-out active:scale-98"
     >
      <span className="font-medium text-blue-700">{e.name}</span>
      <span className="text-xs text-blue-400">{e.role}</span>
     </a>
    ))}
   </div>
  </section>
 )
}
