import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies.js';
import { users } from './users.js';

export const importJobStatusEnum = pgEnum('import_job_status', [
  'queued',
  'processing',
  'completed',
  'failed',
]);

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  uploadedByUserId: uuid('uploaded_by_user_id')
    .notNull()
    .references(() => users.id),
  status: importJobStatusEnum('status').notNull(),
  originalFilename: text('original_filename').notNull(),
  r2ObjectKey: text('r2_object_key').notNull(),
  rowCount: integer('row_count'),
  errorCode: varchar('error_code', { length: 64 }),
  errorMessage: text('error_message'),
  isActive: boolean('is_active').notNull().default(false),
  queuedAt: timestamp('queued_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});
