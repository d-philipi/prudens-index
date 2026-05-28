import type { ClientProductsResponseDto, ItemStatus } from '@prudens/shared/types';
import type { AuthContext } from '../types/auth-context.js';
import { toStockProductDto } from '../lib/mappers.js';
import { assertClient } from './auth-context-service.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { stockProductRepository } from '../repositories/stock-product-repository.js';

export interface ClientProductsQuery {
  term?: string;
  item_status?: ItemStatus[];
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const clientProductsService = {
  async getProducts(
    ctx: AuthContext,
    query: ClientProductsQuery,
  ): Promise<ClientProductsResponseDto> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const active = await importJobRepository.findActiveByCompany(companyId);

    if (!active) {
      return { items: [], nextCursor: null, total: 0, currentPage: 1, totalPages: 1, pageSize: 50, chart_data: [] };
    }

    const limit = Math.min(query.limit ?? 50, 100);
    const requestedPage = Math.max(query.page ?? 1, 1);
    const baseParams = {
      companyId,
      importJobId: active.id,
      term: query.term,
      itemStatuses: query.item_status,
      sort: query.sort,
      order: query.order,
      page: requestedPage,
    };

    const total = await stockProductRepository.countFiltered(baseParams);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const page = Math.min(requestedPage, totalPages);

    const [rows, chartRows] = await Promise.all([
      stockProductRepository.findFiltered(baseParams, limit, page),
      stockProductRepository.chartData(baseParams, 500),
    ]);

    const items = rows.map(toStockProductDto);
    const nextCursor = null;

    const chart_data = chartRows.map((r) => ({
      product_name: r.productName,
      idd: parseFloat(r.idd),
      item_status: r.itemStatus as ItemStatus,
    }));

    return { items, nextCursor, total, currentPage: page, totalPages, pageSize: limit, chart_data };
  },
};
