import {
  contentTypeForSpreadsheetFilename,
  isSpreadsheetFilename,
  SPREADSHEET_FILE_ACCEPT,
} from '@prudens/shared/spreadsheetFormats';

export { SPREADSHEET_FILE_ACCEPT };

export function isSpreadsheetFile(file: File): boolean {
  return isSpreadsheetFilename(file.name);
}

export function contentTypeForSpreadsheet(file: File): string {
  return contentTypeForSpreadsheetFilename(file.name);
}
