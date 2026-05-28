import type { ImportJobDto, ImportValidationError, StockProductDto } from '@prudens/shared/types';
import type { importJobs } from '../../drizzle/schema/import-jobs.js';
import type { stockProducts } from '../../drizzle/schema/stock-products.js';

export function toImportJobDto(row: typeof importJobs.$inferSelect): ImportJobDto {
  const validationErrors = Array.isArray(row.validationErrors)
    ? (row.validationErrors as ImportValidationError[])
    : [];

  return {
    id: row.id,
    companyId: row.companyId,
    status: row.status,
    originalFilename: row.originalFilename,
    rowCount: row.rowCount,
    errorMessage: row.errorMessage,
    validationErrors,
    isActive: row.isActive,
    queuedAt: row.queuedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function num(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function toStockProductDto(row: typeof stockProducts.$inferSelect): StockProductDto {
  const idd = num(row.idd);
  return {
    id: row.id,
    productName: row.productName,
    ean: row.ean,
    storesWithStock: row.storesWithStock,
    distribution: num(row.distribution),
    branchesWithDemand: row.branchesWithDemand,
    demandVsDistribution: num(row.demandVsDistribution),
    idd: idd ?? 0,
    stock: row.stock,
    averageDemand: num(row.averageDemand),
    stockDays: num(row.stockDays),
    itemStatus: row.itemStatus as StockProductDto['itemStatus'],
  };
}
