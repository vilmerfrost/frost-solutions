const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const IMAGE_FILE_EXTENSION = /\.(avif|bmp|gif|heic|heif|jpe?g|png|webp)$/i

type PhotoFile = Pick<File, 'name' | 'size' | 'type'>

interface StorageBucket {
  upload: (
    path: string,
    file: File,
    options: { cacheControl: string; upsert: boolean }
  ) => Promise<{ error: { message?: string } | null }>
  getPublicUrl: (path: string) => { data: { publicUrl: string } }
  remove?: (paths: string[]) => Promise<unknown>
}

interface StorageClient {
  from: (bucket: string) => StorageBucket
}

export function isSupportedAtaPhotoFile(file: PhotoFile): boolean {
  if (file.size > MAX_FILE_SIZE_BYTES) return false
  if (file.type.startsWith('image/')) return true
  if (!file.type && IMAGE_FILE_EXTENSION.test(file.name)) return true
  return false
}

export async function uploadAtaPhotos({
  tenantId,
  files,
  storage,
}: {
  tenantId: string
  files: File[]
  storage: StorageClient
}): Promise<string[]> {
  const bucket = storage.from('ata-photos')
  const uploadedPaths: string[] = []
  const uploadedUrls: string[] = []
  let failedCount = 0

  for (const photo of files) {
    const fileExt = photo.name.split('.').pop() || 'jpg'
    const filePath = `${tenantId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`

    const { error: uploadError } = await bucket.upload(filePath, photo, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      failedCount += 1
      continue
    }

    const { data } = bucket.getPublicUrl(filePath)

    if (!data.publicUrl) {
      failedCount += 1
      continue
    }

    uploadedPaths.push(filePath)
    uploadedUrls.push(data.publicUrl)
  }

  if (failedCount > 0) {
    if (uploadedPaths.length > 0 && bucket.remove) {
      await bucket.remove(uploadedPaths)
    }
    throw new Error(`${failedCount} av ${files.length} foton kunde inte laddas upp. Försök igen.`)
  }

  return uploadedUrls
}
