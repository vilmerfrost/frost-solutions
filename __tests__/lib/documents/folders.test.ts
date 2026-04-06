import { getFolderConfig, hasRestrictedFolderAccess, isRestrictedFolder } from '@/lib/documents/folders'

describe('document folder restrictions', () => {
  it('marks exact restricted folders as restricted', () => {
    expect(isRestrictedFolder('04-Avtal')).toBe(true)
    expect(isRestrictedFolder('05-Ekonomi')).toBe(true)
  })

  it('marks nested restricted folders as restricted', () => {
    expect(isRestrictedFolder('04-Avtal/Underlag')).toBe(true)
    expect(isRestrictedFolder('05-Ekonomi/Fakturor')).toBe(true)
  })

  it('keeps unrestricted folders open for non-admin uploads', () => {
    expect(isRestrictedFolder('06-Foton/Efter')).toBe(false)
    expect(getFolderConfig('06-Foton/Efter')?.key).toBe('06-Foton')
  })

  it('accepts admin role casing variants for restricted folders', () => {
    expect(hasRestrictedFolderAccess('admin')).toBe(true)
    expect(hasRestrictedFolderAccess('Admin')).toBe(true)
    expect(hasRestrictedFolderAccess('ADMIN')).toBe(true)
    expect(hasRestrictedFolderAccess('worker')).toBe(false)
  })
})
