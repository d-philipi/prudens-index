import { Worker } from 'bullmq';
import '../lib/load-env.js';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import postgres from 'postgres';
import { getR2Client } from '../lib/r2-client.js';
import { spreadsheetParserService } from '../services/spreadsheet-parser-service.js';

const IMPORT_QUEUE_NAME = 'process-import';

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgresql://prudens:prudens@localhost:5432/prudens_index',
);

async function runJob(importJobId: string) {
  const [job] = await sql<
    {
      id: string;
      company_id: string;
      r2_object_key: string;
      original_filename: string;
    }[]
  >`
    SELECT id, company_id, r2_object_key, original_filename
    FROM import_jobs WHERE id = ${importJobId}
  `;
  if (!job) return;

  await sql`
    UPDATE import_jobs SET status = 'processing', started_at = now() WHERE id = ${importJobId}
  `;

  try {
    const bucket = process.env.R2_BUCKET ?? 'prudens-uploads';
    const res = await getR2Client().send(
      new GetObjectCommand({ Bucket: bucket, Key: job.r2_object_key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error('R2_EMPTY');

    const { products, lineErrors } = spreadsheetParserService.parseBuffer(
      Buffer.from(bytes),
      job.original_filename,
    );

    if (products.length === 0) {
      const summary =
        lineErrors.length > 0
          ? `Nenhuma linha válida. ${lineErrors.length} erro(s). Primeiro: linha ${lineErrors[0]!.row_number}, coluna ${lineErrors[0]!.column_name}`
          : 'Nenhuma linha válida na planilha';
      await sql`
        UPDATE import_jobs
        SET status = 'failed', error_message = ${summary}, validation_errors = ${JSON.stringify(lineErrors)}::jsonb, completed_at = now()
        WHERE id = ${importJobId}
      `;
      return;
    }

    for (const p of products) {
      await sql`
        INSERT INTO stock_products (
          import_job_id, company_id, product_name, ean,
          stores_with_stock, distribution, branches_with_demand,
          demand_vs_distribution, idd, stock, average_demand, stock_days,
          item_status
        ) VALUES (
          ${importJobId}, ${job.company_id}, ${p.productName}, ${p.ean},
          ${p.storesWithStock}, ${p.distribution},
          ${p.branchesWithDemand}, ${p.demandVsDistribution},
          ${p.idd}, ${p.stock}, ${p.averageDemand}, ${p.stockDays},
          ${p.itemStatus}
        )
      `;
    }

    const errorSummary =
      lineErrors.length > 0
        ? `${lineErrors.length} linha(s) ignorada(s): ${lineErrors
            .slice(0, 5)
            .map((e) => `L${e.row_number} ${e.column_name}`)
            .join('; ')}`
        : null;

    await sql`
      UPDATE import_jobs SET is_active = false
      WHERE company_id = ${job.company_id} AND is_active = true
    `;
    await sql`
      UPDATE import_jobs
      SET status = 'completed', completed_at = now(), row_count = ${products.length},
          is_active = true, error_message = ${errorSummary}, validation_errors = ${JSON.stringify(lineErrors)}::jsonb
      WHERE id = ${importJobId}
    `;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'PROCESSING_FAILED';
    await sql`
      UPDATE import_jobs
      SET status = 'failed', error_message = ${message}, completed_at = now()
      WHERE id = ${importJobId}
    `;
  }
}

export function startImportWorker() {
  const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };
  const worker = new Worker<{ importJobId: string }>(
    IMPORT_QUEUE_NAME,
    async (job) => {
      await runJob(job.data.importJobId);
    },
    { connection },
  );

  worker.on('failed', (job, err) => {
    console.error('Job failed', job?.id, err);
  });

  console.log('Worker listening on', IMPORT_QUEUE_NAME);
  return worker;
}
