/** Extensões suportadas pelo SheetJS no worker (ordem: match mais longo primeiro). */
export const SPREADSHEET_EXTENSIONS = [
  '.xlsx',
  '.xlsm',
  '.xlsb',
  '.xltx',
  '.xltm',
  '.xls',
  '.csv',
  '.tsv',
  '.ods',
  '.fods',
] as const;

export type SpreadsheetExtension = (typeof SPREADSHEET_EXTENSIONS)[number];

/** Valor do atributo HTML `accept` (somente extensões — compatível com Explorer no Windows). */
export const SPREADSHEET_FILE_ACCEPT = SPREADSHEET_EXTENSIONS.join(',');

export const SPREADSHEET_CONTENT_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'application/vnd.oasis.opendocument.spreadsheet',
  'text/csv',
  'text/tab-separated-values',
] as const;

export type SpreadsheetContentType = (typeof SPREADSHEET_CONTENT_TYPES)[number];

const EXTENSIONS_BY_LENGTH = [...SPREADSHEET_EXTENSIONS].sort((a, b) => b.length - a.length);

export function getSpreadsheetExtension(filename: string): SpreadsheetExtension | '' {
  const lower = filename.toLowerCase();
  for (const ext of EXTENSIONS_BY_LENGTH) {
    if (lower.endsWith(ext)) return ext;
  }
  return '';
}

export function isSpreadsheetFilename(filename: string): boolean {
  return getSpreadsheetExtension(filename) !== '';
}

export function contentTypeForSpreadsheetFilename(filename: string): SpreadsheetContentType {
  const ext = getSpreadsheetExtension(filename);
  switch (ext) {
    case '.csv':
      return 'text/csv';
    case '.tsv':
      return 'text/tab-separated-values';
    case '.xls':
      return 'application/vnd.ms-excel';
    case '.xlsm':
      return 'application/vnd.ms-excel.sheet.macroEnabled.12';
    case '.xlsb':
      return 'application/vnd.ms-excel.sheet.binary.macroEnabled.12';
    case '.ods':
    case '.fods':
      return 'application/vnd.oasis.opendocument.spreadsheet';
    default:
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
}
