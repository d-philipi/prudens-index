import PDFDocument from 'pdfkit';
import type { AuthContext } from '../types/auth-context.js';
import type { ClientProductFiltersDto, ItemStatus } from '@prudens/shared/types';
import { assertClient } from './auth-context-service.js';
import { clientOverviewService } from './client-overview-service.js';
import { clientProductsService } from './client-products-service.js';

export const exportPdfService = {
  async generate(
    ctx: AuthContext,
    input: { term?: string; itemStatuses: ItemStatus[] },
  ): Promise<Buffer> {
    assertClient(ctx);
    const overview = await clientOverviewService.getOverview(ctx);
    const { items } = await clientProductsService.getProducts(ctx, {
      term: input.term,
      item_status: input.itemStatuses.length > 0 ? input.itemStatuses : undefined,
      limit: 500,
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Prudens Index — Relatório de Estoque', { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          `${overview.companyName} | IDD médio: ${overview.avgIdd?.toFixed(2) ?? '—'} | Produtos: ${items.length}`,
        );
      doc.moveDown();

      for (const p of items.slice(0, 200)) {
        doc
          .fontSize(10)
          .text(
            `${p.productName} | ${p.itemStatus} | IDD: ${p.idd} | estoque: ${p.stock ?? '—'}`,
          );
      }

      doc.end();
    });
  },
};
