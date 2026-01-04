'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/context/TenantContext'
import supabase from '@/utils/supabase/supabaseClient'

interface FileMetadata {
 id: string
 entity_type: string
 entity_id: string
 file_path: string
 file_name: string
 file_size: number
 file_type: string
 url: string
 description?: string
 created_at: string
}

interface FileListProps {
 entityType: 'project' | 'invoice'
 entityId: string
}

/**
 * Component for displaying and managing files for a project or invoice
 */
export default function FileList({ entityType, entityId }: FileListProps) {
 const { tenantId } = useTenant()
 const [files, setFiles] = useState<FileMetadata[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  if (!tenantId) {
   setLoading(false)
   return
  }

  loadFiles()
 }, [tenantId, entityType, entityId])

 async function loadFiles() {
  try {
   // Try to fetch from a files/attachments table if it exists
   // For now, we'll use a simple approach with file paths
   // This would ideally come from a database table storing file metadata
   
   // List files from Supabase Storage
   const { data, error } = await supabase.storage
    .from('attachments')
    .list(`${entityType}/${entityId}`, {
     limit: 100,
     offset: 0,
    })

   if (error) {
    // If bucket doesn't exist or no files, that's ok
    if (error.message?.includes('not found')) {
     setFiles([])
    } else {
     console.error('Error loading files:', error)
    }
   } else {
    // Build file URLs
    const fileList = (data || []).map(file => ({
     id: file.id || file.name,
     entity_type: entityType,
     entity_id: entityId,
     file_path: `${entityType}/${entityId}/${file.name}`,
     file_name: file.name,
     file_size: file.metadata?.size || 0,
     file_type: file.metadata?.mimetype || 'application/octet-stream',
     url: '', // Will be set below
     created_at: file.created_at || new Date().toISOString(),
    }))

    // Get public URLs
    const filesWithUrls = await Promise.all(
     fileList.map(async (file) => {
      const { data: urlData } = supabase.storage
       .from('attachments')
       .getPublicUrl(file.file_path)
      return { ...file, url: urlData.publicUrl }
     })
    )

    setFiles(filesWithUrls)
   }
  } catch (err) {
   console.error('Error loading files:', err)
   setFiles([])
  } finally {
   setLoading(false)
  }
 }

 function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
 }

 function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType === 'application/pdf') return '📄'
  if (fileType.startsWith('text/')) return '📝'
  return '📎'
 }

 if (loading) {
  return (
   <div className="text-center py-4 text-gray-500 dark:text-gray-400">
    Laddar filer...
   </div>
  )
 }

 if (files.length === 0) {
  return (
   <div className="text-center py-4 text-gray-500 dark:text-gray-400">
    Inga filer ännu
   </div>
  )
 }

 return (
  <div className="space-y-2">
   {files.map((file) => (
    <div
     key={file.id}
     className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
    >
     <div className="flex items-center gap-3 flex-1 min-w-0">
      <span className="text-2xl flex-shrink-0">{getFileIcon(file.file_type)}</span>
      <div className="flex-1 min-w-0">
       <div className="font-semibold text-gray-900 dark:text-white truncate">
        {file.file_name}
       </div>
       <div className="text-xs text-gray-500 dark:text-gray-400">
        {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('sv-SE')}
       </div>
      </div>
     </div>
     <div className="flex items-center gap-2 flex-shrink-0">
      <a
       href={file.url}
       target="_blank"
       rel="noopener noreferrer"
       className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
      >
       Öppna
      </a>
     </div>
    </div>
   ))}
  </div>
 )
}

