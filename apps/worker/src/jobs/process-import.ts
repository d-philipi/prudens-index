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

    const products = spreadsheetParserService.parseBuffer(
      Buffer.from(bytes),
      job.original_filename,
    );

    for (const p of products) {
      await sql`
        INSERT INTO stock_products (
          import_job_id, company_id, product_name, ean,
          branches_with_stock, distribution, branches_with_demand,
          demand_vs_distribution, idd, stock, avg_demand, stock_days,
          item_status, category
        ) VALUES (
          ${importJobId}, ${job.company_id}, ${p.productName}, ${p.ean},
          ${sql.json(p.branchesWithStock)}, ${p.distribution},
          ${sql.json(p.branchesWithDemand)}, ${p.demandVsDistribution},
          ${p.idd}, ${p.stock}, ${p.avgDemand}, ${p.stockDays},
          ${p.itemStatus}, ${p.category}
        )
      `;
    }

    await sql`
      UPDATE import_jobs SET is_active = false
      WHERE company_id = ${job.company_id} AND is_active = true
    `;
    await sql`
      UPDATE import_jobs
      SET status = 'completed', completed_at = now(), row_count = ${products.length}, is_active = true
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
