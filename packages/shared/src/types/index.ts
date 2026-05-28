export type UserRole = 'admin' | 'client';

export type ImportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ItemStatus = 'distribution' | 'adequate' | 'boost';

export interface CompanyDto {
  id: string;
  name: string;
  slug: string;
  cnpj?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface CreateCompanyRequest {
  name: string;
  cnpj?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface CompanyCreated {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
}

export interface ImportJobDto {
  id: string;
  companyId: string;
  status: ImportJobStatus;
  originalFilename: string;
  rowCount: number | null;
  errorMessage: string | null;
  validationErrors: ImportValidationError[];
  isActive: boolean;
  queuedAt: string;
  completedAt: string | null;
}

export interface ImportValidationError {
  row_number: number;
  column_name: string;
  error_message: string;
  expected_value: string | null;
  received_value: string | null;
}

export interface StockProductDto {
  id: string;
  productName: string;
  ean: string | null;
  storesWithStock: number;
  distribution: number | null;
  branchesWithDemand: number;
  demandVsDistribution: number | null;
  idd: number;
  stock: number | null;
  averageDemand: number | null;
  stockDays: number | null;
  unitPrice: number | null;
  projectedRevenue: number | null;
  tiedUpCapital: number | null;
  lostRevenue: number | null;
  itemStatus: ItemStatus;
}

export interface AdminMetricsDto {
  totalCompanies: number;
  totalProducts: number;
  avgIddByCompany: Array<{
    companyId: string;
    companyName: string;
    avgIdd: number | null;
  }>;
}

export interface AdminCompanyCardDto {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  avgIdd: number | null;
  createdAt: string;
}

export interface AdminCompanyDetailDto {
  company: CompanyDto & { createdAt: string; metadata?: Record<string, string | number | null> | null };
  stats: {
    totalProducts: number;
    avgIdd: number | null;
    lastUpdatedAt: string | null;
  };
  imports: ImportJobDto[];
  activeImportJobId: string | null;
}

export interface ClientOverviewDto {
  companyName: string;
  avgIdd: number | null;
  lastUpdatedAt: string | null;
}

export interface ChartDataPointDto {
  product_name: string;
  idd: number;
  item_status: ItemStatus;
}

export interface ClientProductsResponseDto {
  items: StockProductDto[];
  nextCursor: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  chart_data: ChartDataPointDto[];
}

export interface ClientProductFiltersDto {
  term?: string;
  itemStatuses: ItemStatus[];
}
