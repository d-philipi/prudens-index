import PDFDocument from 'pdfkit';
import type { AuthContext } from '../types/auth-context.js';
import type { DashboardFiltersDto } from '@prudens/shared/types';
import { assertClient } from './auth-context-service.js';
import { stockProductRepository } from '../repositories/stock-product-repository.js';
import { stockSummaryService } from './stock-summary-service.js';
import { toStockProductDto } from '../lib/mappers.js';
import { filterProducts } from '@prudens/domain-metrics';

export const exportPdfService = {
  async generate(
    ctx: AuthContext,
    input: { productIds: string[]; filters: DashboardFiltersDto },
  ): Promise<Buffer> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const rows = await stockProductRepository.findByIds(companyId, input.productIds);
    let products = rows.map(toStockProductDto);
    products = filterProducts(products, input.filters);
    const summary = await stockSummaryService.getSummary(ctx);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Prudens Index — Stock Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Products: ${summary.totalProducts} | Critical: ${summary.criticalCount}`);
      doc.moveDown();

      for (const p of products.slice(0, 200)) {
        doc.fontSize(10).text(`${p.productName} | ${p.itemStatus} | stock: ${p.stock ?? '-'}`);
      }

      doc.end();
    });
  },
};
