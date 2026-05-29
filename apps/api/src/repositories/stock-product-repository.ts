import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { db } from '../lib/db.js';
import { stockProducts } from '../../drizzle/schema/stock-products.js';
import type {
  ClientDashboardSummaryDto,
  ItemStatus,
  ProductHighlightDto,
  RiskProductDto,
  StatusCountDto,
} from '@prudens/shared/types';
import { STATUS_DISPLAY_ORDER } from '@prudens/shared/status-config';

export interface ProductQueryParams {
  companyId: string;
  importJobId: string;
  term?: string;
  itemStatuses?: ItemStatus[];
  iddMin?: number;
  iddMax?: number;
  stockDaysMin?: number;
  stockDaysMax?: number;
  tiedUpCapitalMin?: number;
  tiedUpCapitalMax?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
}

const SORT_COLUMNS = {
  product_name: stockProducts.productName,
  ean: stockProducts.ean,
  stores_with_stock: stockProducts.storesWithStock,
  distribution: stockProducts.distribution,
  branches_with_demand: stockProducts.branchesWithDemand,
  demand_vs_distribution: stockProducts.demandVsDistribution,
  idd: stockProducts.idd,
  stock: stockProducts.stock,
  average_demand: stockProducts.averageDemand,
  stock_days: stockProducts.stockDays,
  unit_price: stockProducts.unitPrice,
  projected_revenue: stockProducts.projectedRevenue,
  tied_up_capital: stockProducts.tiedUpCapital,
  lost_revenue: stockProducts.lostRevenue,
  item_status: stockProducts.itemStatus,
} as const;

type SortColumn = (typeof SORT_COLUMNS)[keyof typeof SORT_COLUMNS];

function buildWhere(params: ProductQueryParams, extra?: SQL): SQL {
  const parts: SQL[] = [
    eq(stockProducts.companyId, params.companyId),
    eq(stockProducts.importJobId, params.importJobId),
  ];
  if (params.term?.trim()) {
    const pattern = `%${params.term.trim()}%`;
    parts.push(
      or(ilike(stockProducts.productName, pattern), ilike(stockProducts.ean, pattern))!,
    );
  }
  if (params.itemStatuses && params.itemStatuses.length > 0) {
    parts.push(inArray(stockProducts.itemStatus, params.itemStatuses));
  }
  if (params.iddMin != null) {
    parts.push(gte(stockProducts.idd, String(params.iddMin)));
  }
  if (params.iddMax != null) {
    parts.push(lte(stockProducts.idd, String(params.iddMax)));
  }
  if (params.stockDaysMin != null) {
    parts.push(gte(stockProducts.stockDays, String(params.stockDaysMin)));
  }
  if (params.stockDaysMax != null) {
    parts.push(lte(stockProducts.stockDays, String(params.stockDaysMax)));
  }
  if (params.tiedUpCapitalMin != null) {
    parts.push(gte(stockProducts.tiedUpCapital, params.tiedUpCapitalMin));
  }
  if (params.tiedUpCapitalMax != null) {
    parts.push(lte(stockProducts.tiedUpCapital, params.tiedUpCapitalMax));
  }
  if (extra) parts.push(extra);
  return and(...parts)!;
}

export const stockProductRepository = {
  async bulkInsert(rows: (typeof stockProducts.$inferInsert)[]) {
    if (rows.length === 0) return;
    await db.insert(stockProducts).values(rows);
  },

  async findByActiveImport(companyId: string, importJobId: string) {
    return db
      .select()
      .from(stockProducts)
      .where(
        and(eq(stockProducts.companyId, companyId), eq(stockProducts.importJobId, importJobId)),
      );
  },

  async countFiltered(params: ProductQueryParams) {
    const [row] = await db
      .select({ total: count() })
      .from(stockProducts)
      .where(buildWhere(params));
    return Number(row?.total ?? 0);
  },

  async findFiltered(params: ProductQueryParams, take: number, page: number) {
    const sortKey = params.sort ?? 'idd';
    const col: SortColumn =
      sortKey in SORT_COLUMNS
        ? SORT_COLUMNS[sortKey as keyof typeof SORT_COLUMNS]
        : stockProducts.idd;
    const isAsc = params.order === 'asc';
    const orderCol = isAsc ? asc(col) : desc(col);

    const where = buildWhere(params);
    const offset = Math.max(page - 1, 0) * take;

    return db
      .select()
      .from(stockProducts)
      .where(where)
      .orderBy(orderCol, desc(stockProducts.id))
      .limit(take)
      .offset(offset);
  },

  async chartData(params: ProductQueryParams, chartLimit = 500) {
    return db
      .select({
        productName: stockProducts.productName,
        idd: stockProducts.idd,
        itemStatus: stockProducts.itemStatus,
      })
      .from(stockProducts)
      .where(buildWhere(params))
      .orderBy(desc(stockProducts.idd))
      .limit(chartLimit);
  },

  async avgIddForCompany(companyId: string, importJobId: string) {
    const [row] = await db
      .select({
        avg: sql<string>`avg(${stockProducts.idd}::numeric)`,
      })
      .from(stockProducts)
      .where(
        and(eq(stockProducts.companyId, companyId), eq(stockProducts.importJobId, importJobId)),
      );
    const n = row?.avg != null ? parseFloat(row.avg) : null;
    return n != null && Number.isFinite(n) ? n : null;
  },

  async aggregateExecutiveSummary(
    params: ProductQueryParams,
  ): Promise<ClientDashboardSummaryDto> {
    const where = buildWhere(params);

    const [totals] = await db
      .select({
        totalProjectedRevenue: sql<number>`coalesce(sum(${stockProducts.projectedRevenue}), 0)`,
        totalTiedUpCapital: sql<number>`coalesce(sum(${stockProducts.tiedUpCapital}), 0)`,
        totalLostRevenue: sql<number>`coalesce(sum(${stockProducts.lostRevenue}), 0)`,
      })
      .from(stockProducts)
      .where(where);

    const statusRows = await db
      .select({
        status: stockProducts.itemStatus,
        count: count(),
      })
      .from(stockProducts)
      .where(where)
      .groupBy(stockProducts.itemStatus);

    const countMap = new Map<ItemStatus, number>(
      statusRows.map((r) => [r.status, Number(r.count)]),
    );
    const statusCounts: StatusCountDto[] = STATUS_DISPLAY_ORDER.map((status) => ({
      status,
      count: countMap.get(status) ?? 0,
    }));

    const riskRows = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        lostRevenue: stockProducts.lostRevenue,
        tiedUpCapital: stockProducts.tiedUpCapital,
      })
      .from(stockProducts)
      .where(where)
      .orderBy(
        sql`(coalesce(${stockProducts.lostRevenue}, 0) + coalesce(${stockProducts.tiedUpCapital}, 0)) desc`,
        asc(stockProducts.productName),
      )
      .limit(3);

    const topRiskProducts: RiskProductDto[] = riskRows.map((r) => {
      const lost = r.lostRevenue ?? 0;
      const tied = r.tiedUpCapital ?? 0;
      return {
        productName: r.productName,
        ean: r.ean,
        lostRevenue: lost,
        tiedUpCapital: tied,
        riskScore: lost + tied,
      };
    });

    const toHighlight = (
      row: {
        productName: string;
        ean: string | null;
        value: string | number | null;
      } | undefined,
    ): ProductHighlightDto | null => {
      if (!row || row.value == null) return null;
      const n = typeof row.value === 'number' ? row.value : parseFloat(String(row.value));
      if (!Number.isFinite(n)) return null;
      return { productName: row.productName, ean: row.ean, value: n };
    };

    const [minStockDays] = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        value: stockProducts.stockDays,
      })
      .from(stockProducts)
      .where(and(where, sql`${stockProducts.stockDays} is not null`))
      .orderBy(asc(stockProducts.stockDays))
      .limit(1);

    const [maxStockDays] = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        value: stockProducts.stockDays,
      })
      .from(stockProducts)
      .where(where)
      .orderBy(desc(stockProducts.stockDays))
      .limit(1);

    const [minIdd] = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        value: stockProducts.idd,
      })
      .from(stockProducts)
      .where(where)
      .orderBy(asc(stockProducts.idd))
      .limit(1);

    const [maxIdd] = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        value: stockProducts.idd,
      })
      .from(stockProducts)
      .where(where)
      .orderBy(desc(stockProducts.idd))
      .limit(1);

    const [minProjectedRevenue] = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        value: stockProducts.projectedRevenue,
      })
      .from(stockProducts)
      .where(and(where, sql`${stockProducts.projectedRevenue} is not null`))
      .orderBy(asc(stockProducts.projectedRevenue))
      .limit(1);

    const [maxProjectedRevenue] = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        value: stockProducts.projectedRevenue,
      })
      .from(stockProducts)
      .where(where)
      .orderBy(desc(stockProducts.projectedRevenue))
      .limit(1);

    const [maxTiedUpCapital] = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        value: stockProducts.tiedUpCapital,
      })
      .from(stockProducts)
      .where(and(where, sql`${stockProducts.tiedUpCapital} is not null`))
      .orderBy(desc(stockProducts.tiedUpCapital))
      .limit(1);

    const [maxLostRevenue] = await db
      .select({
        productName: stockProducts.productName,
        ean: stockProducts.ean,
        value: stockProducts.lostRevenue,
      })
      .from(stockProducts)
      .where(and(where, sql`${stockProducts.lostRevenue} is not null`))
      .orderBy(desc(stockProducts.lostRevenue))
      .limit(1);

    return {
      totalProjectedRevenue: Number(totals?.totalProjectedRevenue ?? 0),
      totalTiedUpCapital: Number(totals?.totalTiedUpCapital ?? 0),
      totalLostRevenue: Number(totals?.totalLostRevenue ?? 0),
      statusCounts,
      topRiskProducts,
      minStockDays: toHighlight(minStockDays),
      maxStockDays: toHighlight(maxStockDays),
      minIdd: toHighlight(minIdd),
      maxIdd: toHighlight(maxIdd),
      minProjectedRevenue: toHighlight(minProjectedRevenue),
      maxProjectedRevenue: toHighlight(maxProjectedRevenue),
      maxTiedUpCapital: toHighlight(maxTiedUpCapital),
      maxLostRevenue: toHighlight(maxLostRevenue),
    };
  },

  async aggregateRanges(importJobId: string) {
    const [row] = await db
      .select({
        iddMin: sql<string>`min(${stockProducts.idd}::numeric)`,
        iddMax: sql<string>`max(${stockProducts.idd}::numeric)`,
        stockDaysMin: sql<string>`min(${stockProducts.stockDays}::numeric)`,
        stockDaysMax: sql<string>`max(${stockProducts.stockDays}::numeric)`,
        tiedMin: sql<number>`min(${stockProducts.tiedUpCapital})`,
        tiedMax: sql<number>`max(${stockProducts.tiedUpCapital})`,
      })
      .from(stockProducts)
      .where(eq(stockProducts.importJobId, importJobId));

    const parseNum = (v: string | number | null | undefined): number | null => {
      if (v == null) return null;
      const n = typeof v === 'number' ? v : parseFloat(v);
      return Number.isFinite(n) ? n : null;
    };

    return {
      iddMin: parseNum(row?.iddMin),
      iddMax: parseNum(row?.iddMax),
      stockDaysMin: parseNum(row?.stockDaysMin),
      stockDaysMax: parseNum(row?.stockDaysMax),
      tiedUpCapitalMin: parseNum(row?.tiedMin),
      tiedUpCapitalMax: parseNum(row?.tiedMax),
    };
  },
};
