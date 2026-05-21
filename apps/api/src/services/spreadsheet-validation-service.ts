import {
  isSpreadsheetFilename,
  SPREADSHEET_CONTENT_TYPES,
} from '@prudens/shared/spreadsheetFormats';
import { validateSpreadsheetHeaders } from '@prudens/shared/spreadsheetTemplate';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set<string>(SPREADSHEET_CONTENT_TYPES);

export const spreadsheetValidationService = {
  validateUploadMeta(input: {
    filename: string;
    contentType: string;
    sizeBytes: number;
  }): { ok: true } | { ok: false; code: string; message: string } {
    if (!isSpreadsheetFilename(input.filename)) {
      return {
        ok: false,
        code: 'INVALID_FORMAT',
        message:
          'Formato não suportado. Use planilhas .xlsx, .xls, .xlsm, .xlsb, .csv, .tsv ou .ods',
      };
    }
    if (!ALLOWED_TYPES.has(input.contentType)) {
      return { ok: false, code: 'INVALID_FORMAT', message: 'Unsupported content type' };
    }
    if (input.sizeBytes > MAX_BYTES) {
      return { ok: false, code: 'FILE_TOO_LARGE', message: 'File exceeds 10 MB limit' };
    }
    if (input.sizeBytes <= 0) {
      return { ok: false, code: 'EMPTY_FILE', message: 'File is empty' };
    }
    return { ok: true };
  },

  validateHeaders(headers: string[]): { ok: true } | { ok: false; code: string; message: string } {
    const result = validateSpreadsheetHeaders(headers);
    if (!result.valid) {
      return { ok: false, code: 'INVALID_STRUCTURE', message: result.error ?? 'Invalid headers' };
    }
    return { ok: true };
  },
};
