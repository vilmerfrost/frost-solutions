type CommentBoxProps = {
 value: string,
 onChange: (val: string) => void
}
export default function CommentBox({ value, onChange }: CommentBoxProps) {
 return (
  <div>
   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kommentar</label>
   <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    rows={3}
    placeholder="Beskriv vad som gjordes..."
    className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all hover:border-gray-300 dark:hover:border-gray-600"
   />
  </div>
 )
}
