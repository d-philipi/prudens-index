import PDFDocument from 'pdfkit';
import { formatCurrency, formatPercent, formatStockDays } from '@prudens/shared/formatters';
import { STATUS_CONFIG, STATUS_DISPLAY_ORDER } from '@prudens/shared/status-config';
import type { ItemStatus } from '@prudens/shared/types';
import type { AuthContext } from '../types/auth-context.js';
import { assertClient } from './auth-context-service.js';
import { clientDashboardSummaryService } from './client-dashboard-summary-service.js';
import { clientOverviewService } from './client-overview-service.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { stockProductRepository } from '../repositories/stock-product-repository.js';
import { toStockProductDto } from '../lib/mappers.js';

const BRAND_GREEN = '#1a4731';
const BRAND_AMBER = '#d4a020';

function pdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export const clientExportPdfService = {
  async generateDashboardPdf(ctx: AuthContext): Promise<Buffer> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const overview = await clientOverviewService.getOverview(ctx);
    const active = await importJobRepository.findActiveByCompany(companyId);

    if (!active) {
      const err = new Error('Nenhuma importação ativa para gerar relatório.') as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }

    const summary = await clientDashboardSummaryService.getSummary(ctx);
    const products = (
      await stockProductRepository.findByActiveImport(companyId, active.id)
    ).map(toStockProductDto);

    if (products.length === 0) {
      const err = new Error('Não há produtos na importação ativa.') as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }

    const chartPoints = [...products]
      .sort((a, b) => a.idd - b.idd)
      .slice(0, 40);

    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fillColor(BRAND_GREEN).fontSize(22).text('Prudens INDEX', { continued: true });
    doc.fillColor(BRAND_AMBER).text(' — Relatório de Estoque');
    doc.moveDown(0.5);
    doc.fillColor('#333').fontSize(11);
    doc.text(`Empresa: ${overview.companyName}`);
    if (overview.lastUpdatedAt) {
      doc.text(`Atualizado em: ${new Date(overview.lastUpdatedAt).toLocaleString('pt-BR')}`);
    }
    doc.moveDown();
    doc.fontSize(10).fillColor('#555');
    doc.text(
      'Este relatório apresenta a situação de estoque da importação ativa. Use os status para priorizar reabastecimento, distribuição ou impulsionamento de vendas.',
    );
    doc.moveDown();

    doc.fillColor(BRAND_GREEN).fontSize(14).text('Resumo executivo');
    doc.moveDown(0.3);
    doc.fillColor('#333').fontSize(10);
    doc.text(`Faturamento projetado total: ${formatCurrency(summary.totalProjectedRevenue)}`);
    doc.text(`Capital imobilizado total: ${formatCurrency(summary.totalTiedUpCapital)}`);
    doc.text(`Faturamento perdido total: ${formatCurrency(summary.totalLostRevenue)}`);
    doc.moveDown(0.5);

    doc.text('Produtos por status:');
    for (const row of summary.statusCounts) {
      const cfg = STATUS_CONFIG[row.status];
      doc.text(`  • ${cfg.label}: ${row.count}`);
    }

    if (summary.topRiskProducts.length > 0) {
      doc.moveDown(0.5);
      doc.text('Top itens em risco financeiro:');
      for (const r of summary.topRiskProducts) {
        doc.text(
          `  • ${r.productName} — ${formatCurrency(r.riskScore)} (perdido + imobilizado)`,
        );
      }
    }

    doc.moveDown();
    doc.fillColor(BRAND_GREEN).fontSize(14).text('Variação de IDD (menor → maior)');
    doc.moveDown(0.5);

    const barMaxHeight = 80;
    const barWidth = Math.max(4, Math.floor(pageWidth / Math.max(chartPoints.length, 1)) - 2);
    const iddValues = chartPoints.map((p) => p.idd);
    const minIdd = Math.min(...iddValues);
    const maxIdd = Math.max(...iddValues);
    const iddSpan = maxIdd - minIdd || 1;
    const chartBaseY = doc.y + barMaxHeight;

    let x = doc.page.margins.left;
    for (const p of chartPoints) {
      const h = ((p.idd - minIdd) / iddSpan) * barMaxHeight + 4;
      const color = STATUS_CONFIG[p.itemStatus].color;
      doc.rect(x, chartBaseY - h, barWidth, h).fill(color);
      x += barWidth + 2;
    }
    doc.y = chartBaseY + 12;

    doc.moveDown();
    doc.fillColor(BRAND_GREEN).fontSize(14).text('Produtos por status');
    doc.moveDown(0.3);

    for (const status of STATUS_DISPLAY_ORDER) {
      const group = products.filter((p) => p.itemStatus === status);
      if (group.length === 0) continue;

      const cfg = STATUS_CONFIG[status as ItemStatus];
      doc.fillColor(cfg.color).fontSize(11).text(`${cfg.label} (${group.length})`);
      doc.fillColor('#333').fontSize(9);
      for (const p of group.slice(0, 15)) {
        doc.text(
          `  • ${p.productName} — IDD ${formatPercent(p.idd, { decimals: 0 })}, ${formatStockDays(p.stockDays ?? 0)} dias`,
        );
      }
      if (group.length > 15) {
        doc.text(`  … e mais ${group.length - 15} produto(s)`);
      }
      doc.moveDown(0.3);
    }

    doc.moveDown();
    doc.fillColor(BRAND_GREEN).fontSize(12).text('Como interpretar');
    doc.fillColor('#555').fontSize(9);
    doc.text(
      'IDD mede o equilíbrio entre estoque e demanda nas filiais. Dias de estoque indicam quanto tempo o volume atual dura. Status combinam volume e distribuição para orientar a próxima ação operacional.',
    );

    return pdfBuffer(doc);
  },
};
