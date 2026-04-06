import { isSupportedAtaPhotoFile, uploadAtaPhotos } from '@/lib/ata/photoUploads'

describe('ATA photo uploads', () => {
  it('accepts image files even when mobile browsers omit the mime type', () => {
    expect(
      isSupportedAtaPhotoFile({
        name: 'site-photo.jpg',
        type: '',
        size: 1024,
      })
    ).toBe(true)
  })

  it('cleans up uploaded files and throws when any selected photo fails to upload', async () => {
    const upload = jest
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'network' } })

    const getPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/photo-1.jpg' },
    })

    const remove = jest.fn().mockResolvedValue({ error: null })

    const storage = {
      from: jest.fn().mockReturnValue({
        upload,
        getPublicUrl,
        remove,
      }),
    }

    const files = [
      { name: 'photo-1.jpg', type: 'image/jpeg', size: 1024 },
      { name: 'photo-2.jpg', type: 'image/jpeg', size: 1024 },
    ] as File[]

    await expect(
      uploadAtaPhotos({
        tenantId: 'tenant-1',
        files,
        storage,
      })
    ).rejects.toThrow('1 av 2 foton kunde inte laddas upp. Försök igen.')

    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove.mock.calls[0][0]).toHaveLength(1)
  })
})
