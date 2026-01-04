type TimeRangePickerProps = {
 start: string,
 end: string,
 setStart: (val: string) => void,
 setEnd: (val: string) => void
}
export default function TimeRangePicker({ start, end, setStart, setEnd }: TimeRangePickerProps) {
 return (
  <div>
   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tidsperiod</label>
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
    <div>
     <label htmlFor="start" className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Starttid</label>
     <input
      type="time"
      id="start"
      value={start}
      onChange={e => setStart(e.target.value)}
      className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg transition-all hover:border-gray-300 dark:hover:border-gray-600"
     />
    </div>
    <div>
     <label htmlFor="end" className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Sluttid</label>
     <input
      type="time"
      id="end"
      value={end}
      onChange={e => setEnd(e.target.value)}
      className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg transition-all hover:border-gray-300 dark:hover:border-gray-600"
     />
    </div>
   </div>
  </div>
 )
}
