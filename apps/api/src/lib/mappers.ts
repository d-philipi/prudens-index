import type { ImportJobDto, StockProductDto } from '@prudens/shared/types';
import type { importJobs } from '../../drizzle/schema/import-jobs.js';
import type { stockProducts } from '../../drizzle/schema/stock-products.js';

export function toImportJobDto(row: typeof importJobs.$inferSelect): ImportJobDto {
  return {
    id: row.id,
    companyId: row.companyId,
    status: row.status,
    originalFilename: row.originalFilename,
    rowCount: row.rowCount,
    errorMessage: row.errorMessage,
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
  return {
    id: row.id,
    productName: row.productName,
    ean: row.ean,
    branchesWithStock: row.branchesWithStock ?? [],
    distribution: num(row.distribution),
    branchesWithDemand: row.branchesWithDemand ?? [],
    demandVsDistribution: num(row.demandVsDistribution),
    idd: num(row.idd),
    stock: num(row.stock),
    avgDemand: num(row.avgDemand),
    stockDays: num(row.stockDays),
    itemStatus: row.itemStatus,
    category: row.category,
  };
}
