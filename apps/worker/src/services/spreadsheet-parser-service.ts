import * as XLSX from 'xlsx';
import {
  mapRawRow,
  spreadsheetRowSchema,
  validateSpreadsheetHeaders,
} from '@prudens/shared/spreadsheetTemplate';
import { parseBranchList } from '@prudens/domain-metrics';
import { computeItemStatus } from '@prudens/domain-metrics';

export interface ParsedProductRow {
  productName: string;
  ean: string | null;
  branchesWithStock: string[];
  distribution: string | null;
  branchesWithDemand: string[];
  demandVsDistribution: string | null;
  idd: string | null;
  stock: string | null;
  avgDemand: string | null;
  stockDays: string | null;
  itemStatus: 'critical' | 'attention' | 'adequate' | 'excess';
  category: string;
}

function toNumericString(v: number | string | null | undefined): string | null {
  if (v == null || v === '') return null;
  return String(v);
}

export const spreadsheetParserService = {
  parseBuffer(buffer: Buffer, filename: string): ParsedProductRow[] {
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

    const products: ParsedProductRow[] = [];

    for (const row of rows) {
      const cells: Record<string, string | number | null> = {};
      for (const h of headers) {
        cells[h] = row[h] ?? null;
      }
      const mapped = mapRawRow(cells);
      const parsed = spreadsheetRowSchema.safeParse(mapped);
      if (!parsed.success || !mapped.product_name) continue;

      const stockDays = parsed.data.stock_days;
      const idd = parsed.data.idd;
      const itemStatus = computeItemStatus({
        stockDays: typeof stockDays === 'number' ? stockDays : null,
        idd: typeof idd === 'number' ? idd : null,
      });

      products.push({
        productName: mapped.product_name,
        ean: mapped.ean ?? null,
        branchesWithStock: parseBranchList(mapped.branches_with_stock_raw),
        distribution: toNumericString(parsed.data.distribution),
        branchesWithDemand: parseBranchList(mapped.branches_with_demand_raw),
        demandVsDistribution: toNumericString(parsed.data.demand_vs_distribution),
        idd: toNumericString(parsed.data.idd),
        stock: toNumericString(parsed.data.stock),
        avgDemand: toNumericString(parsed.data.avg_demand),
        stockDays: toNumericString(parsed.data.stock_days),
        itemStatus,
        category: 'Sem categoria',
      });

      if (products.length > 5000) break;
    }

    if (products.length === 0) throw new Error('EMPTY_DATA');
    return products;
  },
};
