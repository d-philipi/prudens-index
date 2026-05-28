import { z } from 'zod';

export const SPREADSHEET_HEADERS = [
  'PRODUTO',
  'EAN',
  'Lojas com estoque',
  'distribuição',
  'Lojas com demanda nos últ 3 meses',
  'Demanda x Distribuição',
  'IDD',
  'estoque',
  'demanda media',
  'dias estoque',
] as const;

export type SpreadsheetHeader = (typeof SPREADSHEET_HEADERS)[number];

const intCell = z.union([z.number(), z.string()]).transform((v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null;
  const n = parseInt(String(v).replace(/\s/g, ''), 10);
  return Number.isFinite(n) ? n : null;
});

const floatCell = z.union([z.number(), z.string()]).transform((v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
});

export const spreadsheetRowSchema = z.object({
  product_name: z.string().min(1),
  ean: z.string().nullable().optional(),
  stores_with_stock: intCell.pipe(z.number().default(0)),
  distribution: floatCell.nullable(),
  branches_with_demand: intCell.pipe(z.number().default(0)),
  demand_vs_distribution: floatCell.nullable(),
  idd: floatCell,
  stock: intCell.nullable(),
  average_demand: floatCell.nullable(),
  stock_days: floatCell.nullable(),
});

export type SpreadsheetRowInput = z.infer<typeof spreadsheetRowSchema>;

export function validateSpreadsheetHeaders(headers: string[]): {
  valid: boolean;
  error?: string;
} {
  if (headers.length !== SPREADSHEET_HEADERS.length) {
    return {
      valid: false,
      error: `Expected ${SPREADSHEET_HEADERS.length} columns, got ${headers.length}`,
    };
  }
  for (let i = 0; i < SPREADSHEET_HEADERS.length; i++) {
    const expected = SPREADSHEET_HEADERS[i];
    const actual = headers[i]?.trim();
    if (actual !== expected) {
      return {
        valid: false,
        error: `Column ${i + 1} must be "${expected}", got "${actual ?? ''}"`,
      };
    }
  }
  return { valid: true };
}

function cellToNumber(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function cellToInt(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null;
  const n = parseInt(String(v).replace(/\s/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

export function mapRawRow(cells: Record<string, string | number | null>): SpreadsheetRowInput {
  return {
    product_name: String(cells['PRODUTO'] ?? '').trim(),
    ean: cells['EAN'] != null && String(cells['EAN']).trim() !== '' ? String(cells['EAN']) : null,
    stores_with_stock: cellToInt(cells['Lojas com estoque']) ?? 0,
    distribution: cellToNumber(cells['distribuição']),
    branches_with_demand: cellToInt(cells['Lojas com demanda nos últ 3 meses']) ?? 0,
    demand_vs_distribution: cellToNumber(cells['Demanda x Distribuição']),
    idd: cellToNumber(cells['IDD']),
    stock: cellToInt(cells['estoque']),
    average_demand: cellToNumber(cells['demanda media']),
    stock_days: cellToNumber(cells['dias estoque']),
  };
}
