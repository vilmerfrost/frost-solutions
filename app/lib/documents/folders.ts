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
  return BSAB_FOLDERS.find(f => f.key === key)
}

export function isRestrictedFolder(key: string): boolean {
  const folder = getFolderConfig(key)
  return folder ? 'restricted' in folder && folder.restricted === true : false
}
