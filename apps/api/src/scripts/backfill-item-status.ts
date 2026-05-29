import '../lib/load-env.js';

import { calculateItemStatus } from '@prudens/domain-metrics';
import { eq } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { importJobs } from '../../drizzle/schema/import-jobs.js';
import { stockProducts } from '../../drizzle/schema/stock-products.js';

async function main() {
  const activeJobs = await db
    .select({ id: importJobs.id, companyId: importJobs.companyId })
    .from(importJobs)
    .where(eq(importJobs.isActive, true));

  let updated = 0;

  for (const job of activeJobs) {
    const rows = await db
      .select()
      .from(stockProducts)
      .where(eq(stockProducts.importJobId, job.id));

    for (const row of rows) {
      const stock = row.stock ?? 0;
      const avgFloored = Math.floor(Number(row.averageDemand ?? 0));
      const stockDaysRaw =
        row.stockDays != null && row.stockDays !== ''
          ? Number(row.stockDays)
          : null;
      const idd = Number(row.idd);

      const { item_status, action_insight } = calculateItemStatus({
        stock_days: Number.isFinite(stockDaysRaw as number) ? stockDaysRaw : null,
        stock,
        idd,
        average_demand: avgFloored,
        tied_up_capital: row.tiedUpCapital ?? 0,
      });

      await db
        .update(stockProducts)
        .set({ itemStatus: item_status, actionInsight: action_insight })
        .where(eq(stockProducts.id, row.id));

      updated += 1;
    }

    console.log(`Job ${job.id} (empresa ${job.companyId}): ${rows.length} produto(s) atualizado(s).`);
  }

  console.log(`Backfill concluído: ${updated} registro(s) em ${activeJobs.length} job(s) ativo(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
