import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { AtaPhotoPicker } from '@/components/ata/AtaPhotoPicker'
import { toast } from '@/lib/toast'

jest.mock('@/lib/toast', () => ({
  toast: {
    error: jest.fn(),
  },
}))

function TestHarness() {
  const [files, setFiles] = useState<File[]>([])

  return (
    <AtaPhotoPicker
      files={files}
      onChange={setFiles}
      required
      showRequiredWarning
    />
  )
}

describe('AtaPhotoPicker', () => {
  const createObjectURL = jest.fn()
  const revokeObjectURL = jest.fn()

  beforeAll(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectURL,
    })

    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectURL,
    })
  })

  beforeEach(() => {
    createObjectURL.mockImplementation(() => `blob:${Math.random()}`)
    revokeObjectURL.mockReset()
    jest.mocked(toast.error).mockReset()
  })

  it('shows separate actions for taking a photo and choosing from the phone', () => {
    render(<TestHarness />)

    expect(screen.getByRole('button', { name: 'Ta foto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Välj från telefon' })).toBeInTheDocument()
    expect(screen.getByText(/måste du bifoga minst ett foto/i)).toBeInTheDocument()

    const cameraInput = document.querySelector('input[data-testid="ata-camera-input"]')
    const galleryInput = document.querySelector('input[data-testid="ata-gallery-input"]')

    expect(cameraInput).toHaveAttribute('accept', 'image/*')
    expect(cameraInput).toHaveAttribute('capture', 'environment')
    expect(galleryInput).toHaveAttribute('accept', 'image/*')
    expect(galleryInput).not.toHaveAttribute('capture')
  })

  it('adds valid image files and lets the worker remove them', () => {
    render(<TestHarness />)

    const cameraInput = document.querySelector('input[data-testid="ata-camera-input"]') as HTMLInputElement
    const image = new File(['img'], 'issue.jpg', { type: 'image/jpeg' })

    fireEvent.change(cameraInput, { target: { files: [image] } })

    expect(screen.getByAltText('Foto 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ta bort foto 1' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ta bort foto 1' }))

    expect(screen.queryByAltText('Foto 1')).not.toBeInTheDocument()
  })

  it('rejects files that are not images or are too large', () => {
    render(<TestHarness />)

    const galleryInput = document.querySelector('input[data-testid="ata-gallery-input"]') as HTMLInputElement
    const image = new File(['img'], 'ok.jpg', { type: 'image/jpeg' })
    const textFile = new File(['oops'], 'notes.txt', { type: 'text/plain' })
    const largeImage = new File(['big'], 'big.jpg', { type: 'image/jpeg' })

    Object.defineProperty(largeImage, 'size', { value: 11 * 1024 * 1024 })

    fireEvent.change(galleryInput, { target: { files: [image, textFile, largeImage] } })

    expect(screen.getByAltText('Foto 1')).toBeInTheDocument()
    expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Vissa filer var ogiltiga (endast bilder, max 10MB)')
  })

  it('accepts camera files with empty mime type when the extension is an image', () => {
    render(<TestHarness />)

    const cameraInput = document.querySelector('input[data-testid="ata-camera-input"]') as HTMLInputElement
    const image = new File(['img'], 'issue.jpg', { type: '' })

    fireEvent.change(cameraInput, { target: { files: [image] } })

    expect(screen.getByAltText('Foto 1')).toBeInTheDocument()
    expect(jest.mocked(toast.error)).not.toHaveBeenCalled()
  })
})
