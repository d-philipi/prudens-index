export type UserRole = 'admin' | 'client';

export type ImportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ItemStatus = 'critical' | 'attention' | 'adequate' | 'excess';

export interface CompanyDto {
  id: string;
  name: string;
  slug: string;
}

export interface ImportJobDto {
  id: string;
  companyId: string;
  status: ImportJobStatus;
  originalFilename: string;
  rowCount: number | null;
  errorMessage: string | null;
  isActive: boolean;
  queuedAt: string;
  completedAt: string | null;
}

export interface StockProductDto {
  id: string;
  productName: string;
  ean: string | null;
  branchesWithStock: string[];
  distribution: number | null;
  branchesWithDemand: string[];
  demandVsDistribution: number | null;
  idd: number | null;
  stock: number | null;
  avgDemand: number | null;
  stockDays: number | null;
  itemStatus: ItemStatus;
  category: string;
}

export interface DashboardSummaryDto {
  totalProducts: number;
  criticalCount: number;
  attentionCount: number;
  adequateCount: number;
  excessCount: number;
  avgStockDays: number;
  activeImportJobId: string | null;
}

export interface BranchDistributionPointDto {
  branch: string;
  productCount: number;
  totalDistribution: number;
}

export interface DashboardFiltersDto {
  branches: string[];
  categories: string[];
  itemStatuses: ItemStatus[];
}
