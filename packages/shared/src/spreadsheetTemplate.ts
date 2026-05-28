import { z } from 'zod';
import {
  getSpreadsheetCell,
  normalizeSpreadsheetHeaderKey,
  parseSpreadsheetInt,
  parseSpreadsheetNumber,
} from './spreadsheet-normalize.js';

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
  'Valor Unitário',
] as const;

export type SpreadsheetHeader = (typeof SPREADSHEET_HEADERS)[number];

/** Linha 0 em `validation_errors` indica aviso de coluna ausente (não erro de linha). */
export const SPREADSHEET_MISSING_COLUMN_ROW = 0;

/** Colunas mínimas para importar (demais são opcionais e viram null). */
export const REQUIRED_SPREADSHEET_HEADERS: readonly SpreadsheetHeader[] = ['PRODUTO', 'IDD'];

const CANONICAL_BY_NORMALIZED = Object.fromEntries(
  SPREADSHEET_HEADERS.map((h) => [normalizeSpreadsheetHeaderKey(h), h]),
) as Record<string, SpreadsheetHeader>;

function headersPresentInSheet(headers: string[]): Set<SpreadsheetHeader> {
  const present = new Set<SpreadsheetHeader>();
  for (const h of headers) {
    const canonical = CANONICAL_BY_NORMALIZED[normalizeSpreadsheetHeaderKey(h)];
    if (canonical) present.add(canonical);
  }
  return present;
}

function canonicalizeRowCells(
  cells: Record<string, string | number | null>,
): Partial<Record<SpreadsheetHeader, string | number | null>> {
  const out: Partial<Record<SpreadsheetHeader, string | number | null>> = {};
  for (const [key, value] of Object.entries(cells)) {
    const canonical = CANONICAL_BY_NORMALIZED[normalizeSpreadsheetHeaderKey(key)];
    if (canonical) out[canonical] = value;
  }
  return out;
}

const intCell = z.union([z.number(), z.string()]).transform((v) => parseSpreadsheetInt(v));

const floatCell = z.union([z.number(), z.string()]).transform((v) => parseSpreadsheetNumber(v));

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
  unit_price: floatCell
    .nullable()
    .optional()
    .refine((v) => v === null || v === undefined || v > 0, {
      message: 'Valor unitário deve ser positivo',
    }),
});

export type SpreadsheetRowInput = z.infer<typeof spreadsheetRowSchema>;

export interface SpreadsheetHeaderAnalysis {
  valid: boolean;
  error?: string;
  missingColumns: SpreadsheetHeader[];
  presentColumns: SpreadsheetHeader[];
}

export function analyzeSpreadsheetHeaders(headers: string[]): SpreadsheetHeaderAnalysis {
  const present = headersPresentInSheet(headers);
  const presentColumns = SPREADSHEET_HEADERS.filter((h) => present.has(h));
  const missingColumns = SPREADSHEET_HEADERS.filter((h) => !present.has(h));
  const missingRequired = REQUIRED_SPREADSHEET_HEADERS.filter((h) => !present.has(h));

  if (missingRequired.length > 0) {
    return {
      valid: false,
      error: `Colunas obrigatórias ausentes: ${missingRequired.join(', ')}.`,
      missingColumns,
      presentColumns,
    };
  }

  if (present.size === 0) {
    return {
      valid: false,
      error: 'Nenhuma coluna reconhecida na planilha.',
      missingColumns,
      presentColumns,
    };
  }

  return { valid: true, missingColumns, presentColumns };
}

export function validateSpreadsheetHeaders(headers: string[]): SpreadsheetHeaderAnalysis {
  return analyzeSpreadsheetHeaders(headers);
}

export function missingColumnWarnings(
  missingColumns: SpreadsheetHeader[],
): Array<{
  row_number: number;
  column_name: string;
  error_message: string;
  expected_value: string | null;
  received_value: string | null;
}> {
  return missingColumns.map((column_name) => ({
    row_number: SPREADSHEET_MISSING_COLUMN_ROW,
    column_name,
    error_message:
      'Coluna ausente na planilha. Os valores desta coluna serão exibidos como "—" no painel.',
    expected_value: 'Coluna presente',
    received_value: null,
  }));
}

export function mapRawRow(cells: Record<string, string | number | null>): SpreadsheetRowInput {
  const c = canonicalizeRowCells(cells);

  return {
    product_name: String(c.PRODUTO ?? '').trim(),
    ean: c.EAN != null && String(c.EAN).trim() !== '' ? String(c.EAN) : null,
    stores_with_stock: parseSpreadsheetInt(c['Lojas com estoque']) ?? 0,
    distribution: parseSpreadsheetNumber(c.distribuição),
    branches_with_demand: parseSpreadsheetInt(c['Lojas com demanda nos últ 3 meses']) ?? 0,
    demand_vs_distribution: parseSpreadsheetNumber(c['Demanda x Distribuição']),
    idd: parseSpreadsheetNumber(c.IDD),
    stock: parseSpreadsheetInt(c.estoque),
    average_demand: parseSpreadsheetNumber(c['demanda media']),
    stock_days: parseSpreadsheetNumber(c['dias estoque']),
    unit_price: parseSpreadsheetNumber(c['Valor Unitário']),
  };
}

export { getSpreadsheetCell, normalizeSpreadsheetHeaderKey, parseSpreadsheetNumber };
