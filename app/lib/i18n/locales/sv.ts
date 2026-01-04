// app/lib/i18n/locales/sv.ts

/**
 * Swedish Language Translations
 * Based on Claude implementation
 */

export const sv = {
 common: {
  loading: 'Laddar...',
  error: 'Ett fel uppstod',
  success: 'Lyckades',
  cancel: 'Avbryt',
  save: 'Spara',
  delete: 'Ta bort',
  edit: 'Redigera',
  close: 'Stäng',
  back: 'Tillbaka',
  next: 'Nästa',
  previous: 'Föregående',
  search: 'Sök',
  filter: 'Filtrera',
  sort: 'Sortera',
  actions: 'Åtgärder',
 },
 ocr: {
  upload: {
   title: 'Ladda upp dokument',
   deliveryNote: 'Ladda upp följesedel',
   invoice: 'Ladda upp leverantörsfaktura',
   dragDrop: 'Dra och släpp fil här',
   orClick: 'eller klicka för att välja fil',
   acceptedFormats: 'Tillåtna format',
   maxSize: 'Max storlek',
   uploading: 'Laddar upp...',
   processing: 'Bearbetar...',
   success: 'Uppladdning lyckades',
   error: 'Uppladdning misslyckades',
  },
  result: {
   confidence: 'Konfidens',
   lowConfidence: 'Låg konfidens - granska manuellt',
   supplier: 'Leverantör',
   invoiceNumber: 'Fakturanummer',
   invoiceDate: 'Fakturadatum',
   dueDate: 'Förfallodatum',
   totalAmount: 'Totalt belopp',
   items: 'Rader',
   projectMatch: 'Projektmatchning',
   autoFilled: 'Auto-ifylld',
  },
 },
 workflow: {
  status: {
   pending: 'Väntar',
   processing: 'Bearbetar',
   success: 'Lyckades',
   failed: 'Misslyckades',
   partialSuccess: 'Delvis lyckades',
  },
  steps: {
   upload: 'Fil uppladdad',
   ocrProcessing: 'OCR-bearbetning',
   dataExtraction: 'Dataextraktion',
   validation: 'Validering',
   projectMatching: 'Projektmatchning',
   materialRegistration: 'Materialregistrering',
   complete: 'Klar',
  },
  notifications: {
   success: 'Arbetsflöde slutfört',
   error: 'Arbetsflöde misslyckades',
   warning: 'Arbetsflöde slutfört med varningar',
   connected: 'Ansluten',
   disconnected: 'Frånkopplad',
   reconnecting: 'Återansluter...',
  },
 },
 errors: {
  fileTooLarge: 'Filen är för stor',
  invalidFileType: 'Ogiltigt filformat',
  uploadFailed: 'Uppladdning misslyckades',
  processingFailed: 'Bearbetning misslyckades',
  networkError: 'Nätverksfel',
  unknownError: 'Okänt fel',
 },
} as const;

export type TranslationKey = keyof typeof sv;

