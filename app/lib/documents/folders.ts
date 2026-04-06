/**
 * @deprecated This module is kept for backwards compatibility during migration.
 * New code should use the binder system (app/lib/binders/templates.ts).
 * The BSAB folder structure is now managed as a binder template in the database.
 */

export const BSAB_FOLDERS = [
  { key: '01-Ritningar', name: 'Ritningar', icon: 'blueprint', subfolders: ['A-Arkitekt', 'K-Konstruktion', 'E-El', 'VS-VVS'] },
  { key: '02-Beskrivningar', name: 'Beskrivningar', icon: 'file-text' },
  { key: '03-Administrativt', name: 'Administrativt', icon: 'folder', subfolders: ['Tillstånd', 'Mötesprotokoll', 'Tidplaner'] },
  { key: '04-Avtal', name: 'Avtal', icon: 'file-lock', restricted: true },
  { key: '05-Ekonomi', name: 'Ekonomi', icon: 'banknote', restricted: true },
  { key: '06-Foton', name: 'Foton', icon: 'camera', subfolders: ['Före', 'Under', 'Efter'] },
  { key: '07-KMA', name: 'KMA', icon: 'shield-check' },
] as const

export type FolderKey = typeof BSAB_FOLDERS[number]['key']

export function getFolderConfig(key: string) {
  const normalizedKey = key.split('/')[0]
  return BSAB_FOLDERS.find(f => f.key === normalizedKey)
}

export function isRestrictedFolder(key: string): boolean {
  const folder = getFolderConfig(key)
  return folder ? 'restricted' in folder && folder.restricted === true : false
}

export function hasRestrictedFolderAccess(role: string | null | undefined): boolean {
  return String(role ?? '').toLowerCase() === 'admin'
}
