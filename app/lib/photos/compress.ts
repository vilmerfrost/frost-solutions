'use client'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const MAX_DIMENSION = 2048

export async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_SIZE_BYTES) return file

  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  for (const quality of [0.8, 0.6, 0.4, 0.2]) {
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
    if (blob.size <= MAX_SIZE_BYTES) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
    }
  }

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.1 })
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}
