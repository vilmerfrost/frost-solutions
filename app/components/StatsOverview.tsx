type StatsProps = {
 user: any
 stats: {
  totalHours: number
  activeProjects: number
  invoicesToSend: number
 }
}

export default function StatsOverview({ user, stats }: StatsProps) {
 return (
  <section className="mb-6 flex items-center justify-between gap-4">
   <div>
    <div className="flex items-center gap-2">
     <span className="font-bold text-lg">{user?.name || user?.email || '-'}</span>
     <span className="bg-frost-blue text-white px-2 py-0.5 rounded text-xs">{user?.role || '-'}</span>
     <span className="ml-3 text-gray-500">{new Date().toLocaleDateString('sv-SE')}</span>
     <button className="ml-2"><span className="material-icons">settings</span></button>
    </div>
   </div>
   <div className="flex gap-8">
    <div>
     <div className="text-frost-blue font-semibold">{stats.totalHours}h</div>
     <div className="text-xs text-gray-500">Denna vecka</div>
    </div>
    <div>
     <div className="text-amber-500 font-semibold">{stats.activeProjects}</div>
     <div className="text-xs text-gray-500">Projekt</div>
    </div>
    <div>
     <div className="text-red-500 font-semibold">{stats.invoicesToSend}</div>
     <div className="text-xs text-gray-500">Fakturor att skicka</div>
    </div>
   </div>
  </section>
 )
}
