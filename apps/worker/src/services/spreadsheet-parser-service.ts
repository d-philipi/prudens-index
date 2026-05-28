import * as XLSX from 'xlsx';
import {
  getSpreadsheetCell,
  mapRawRow,
  missingColumnWarnings,
  spreadsheetRowSchema,
  validateSpreadsheetHeaders,
} from '@prudens/shared/spreadsheetTemplate';
import { SHEET_COLUMN_MAPPING } from '@prudens/shared/sheet-mapping';
import { computeItemStatusFromIdd } from '@prudens/domain-metrics';
import type { ImportValidationError, ItemStatus } from '@prudens/shared/types';

export interface ParsedProductRow {
  productName: string;
  ean: string | null;
  storesWithStock: number;
  distribution: string | null;
  branchesWithDemand: number;
  demandVsDistribution: string | null;
  idd: string;
  stock: string | null;
  averageDemand: string | null;
  stockDays: string | null;
  unitPrice: number | null;
  itemStatus: ItemStatus;
}

export interface LineParseError {
  row_number: number;
  column_name: string;
  error_message: string;
  expected_value: string | null;
  received_value: string | null;
}

export interface ParseSpreadsheetResult {
  products: ParsedProductRow[];
  lineErrors: LineParseError[];
  missingColumns: string[];
}

function toNumericString(v: number | null | undefined): string | null {
  if (v == null) return null;
  return String(v);
}

const FIELD_TO_HEADER = Object.fromEntries(
  Object.entries(SHEET_COLUMN_MAPPING).map(([header, config]) => [config.field, header]),
) as Record<string, string>;

function toExpected(type: 'string' | 'int' | 'float'): string {
  if (type === 'int') return 'Número inteiro';
  if (type === 'float') return 'Número decimal';
  return 'Texto';
}

function toValidationErrors(
  rowNumber: number,
  issues: Array<{
    path: Array<string | number>;
    code: string;
    message: string;
  }>,
  row: Record<string, string | number>,
): ImportValidationError[] {
  return issues.map((issue) => {
    const field = String(issue.path[0] ?? '');
    const header = FIELD_TO_HEADER[field] ?? 'Coluna desconhecida';
    const mapping = SHEET_COLUMN_MAPPING[header as keyof typeof SHEET_COLUMN_MAPPING];
    const expected = mapping ? toExpected(mapping.type) : null;
    const rawReceived = getSpreadsheetCell(row, header);
    const received =
      rawReceived == null || String(rawReceived).trim() === '' ? '(vazio)' : String(rawReceived);

    return {
      row_number: rowNumber,
      column_name: header,
      error_message: `Esperado ${expected ?? 'valor válido'}, mas recebido ${received}.`,
      expected_value: expected,
      received_value: received,
    };
  });
}

export const spreadsheetParserService = {
  parseBuffer(buffer: Buffer, _filename: string): ParseSpreadsheetResult {
    const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]!];
    if (!sheet) throw new Error('EMPTY_FILE');

    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
      defval: '',
      raw: false,
    });

    if (rows.length === 0) throw new Error('EMPTY_DATA');

    const headers = Object.keys(rows[0] ?? {});
    const headerCheck = validateSpreadsheetHeaders(headers);
    if (!headerCheck.valid) {
      throw new Error(headerCheck.error ?? 'INVALID_STRUCTURE');
    }

    const columnWarnings = missingColumnWarnings(headerCheck.missingColumns);

    const products: ParsedProductRow[] = [];
    const lineErrors: LineParseError[] = [...columnWarnings];

    for (let i = 0; i < rows.length; i++) {
      const line = i + 2;
      const row = rows[i]!;
      const cells: Record<string, string | number | null> = {};
      for (const h of headers) {
        cells[h] = row[h] ?? null;
      }
      const mapped = mapRawRow(cells);
      const parsed = spreadsheetRowSchema.safeParse(mapped);
      if (!parsed.success) {
        lineErrors.push(
          ...toValidationErrors(line, parsed.error.issues, row),
        );
        continue;
      }
      if (parsed.data.idd == null) {
        lineErrors.push({
          row_number: line,
          column_name: 'IDD',
          error_message: 'IDD obrigatório. Informe um número decimal válido.',
          expected_value: 'Número decimal',
          received_value: String(getSpreadsheetCell(row, 'IDD') ?? '(vazio)'),
        });
        continue;
      }

      let itemStatus: ItemStatus;
      try {
        itemStatus = computeItemStatusFromIdd(parsed.data.idd);
      } catch {
        lineErrors.push({
          row_number: line,
          column_name: 'IDD',
          error_message: 'IDD inválido. Informe um número decimal válido.',
          expected_value: 'Número decimal',
          received_value: String(getSpreadsheetCell(row, 'IDD') ?? '(vazio)'),
        });
        continue;
      }

      products.push({
        productName: parsed.data.product_name,
        ean: parsed.data.ean ?? null,
        storesWithStock: parsed.data.stores_with_stock,
        distribution: toNumericString(parsed.data.distribution),
        branchesWithDemand: parsed.data.branches_with_demand,
        demandVsDistribution: toNumericString(parsed.data.demand_vs_distribution),
        idd: String(parsed.data.idd),
        stock: toNumericString(parsed.data.stock),
        averageDemand: toNumericString(parsed.data.average_demand),
        stockDays: toNumericString(parsed.data.stock_days),
        unitPrice:
          parsed.data.unit_price != null && parsed.data.unit_price > 0
            ? parsed.data.unit_price
            : null,
        itemStatus,
      });

      if (products.length > 5000) break;
    }

    return {
      products,
      lineErrors,
      missingColumns: headerCheck.missingColumns,
    };
  },
};
