import { jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies.js';
import { importJobs } from './import-jobs.js';

export const itemStatusEnum = pgEnum('item_status', [
  'critical',
  'attention',
  'adequate',
  'excess',
]);

export const stockProducts = pgTable('stock_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  importJobId: uuid('import_job_id')
    .notNull()
    .references(() => importJobs.id),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  productName: text('product_name').notNull(),
  ean: varchar('ean', { length: 32 }),
  branchesWithStock: jsonb('branches_with_stock').$type<string[]>().notNull().default([]),
  distribution: numeric('distribution', { precision: 12, scale: 4 }),
  branchesWithDemand: jsonb('branches_with_demand').$type<string[]>().notNull().default([]),
  demandVsDistribution: numeric('demand_vs_distribution', { precision: 12, scale: 4 }),
  idd: numeric('idd', { precision: 12, scale: 4 }),
  stock: numeric('stock', { precision: 12, scale: 4 }),
  avgDemand: numeric('avg_demand', { precision: 12, scale: 4 }),
  stockDays: numeric('stock_days', { precision: 12, scale: 4 }),
  itemStatus: itemStatusEnum('item_status').notNull(),
  category: text('category').notNull().default('Sem categoria'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
