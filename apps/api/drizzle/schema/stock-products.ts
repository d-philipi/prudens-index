import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies.js';
import { importJobs } from './import-jobs.js';

export const itemStatusEnum = pgEnum('item_status_v2', [
  'critical_rupture',
  'low_stock',
  'unbalanced',
  'stuck_stock',
  'slight_excess',
  'healthy',
  'concentrated',
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
  storesWithStock: integer('stores_with_stock').notNull().default(0),
  distribution: numeric('distribution', { precision: 12, scale: 4 }),
  branchesWithDemand: integer('branches_with_demand').notNull().default(0),
  demandVsDistribution: numeric('demand_vs_distribution', { precision: 12, scale: 4 }),
  idd: numeric('idd', { precision: 12, scale: 4 }).notNull(),
  stock: integer('stock'),
  averageDemand: numeric('average_demand', { precision: 12, scale: 4 }),
  stockDays: numeric('stock_days', { precision: 12, scale: 4 }),
  unitPrice: numeric('unit_price', { precision: 12, scale: 4 }),
  projectedRevenue: integer('projected_revenue'),
  tiedUpCapital: integer('tied_up_capital'),
  lostRevenue: integer('lost_revenue'),
  itemStatus: itemStatusEnum('item_status').notNull(),
  actionInsight: text('action_insight'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
