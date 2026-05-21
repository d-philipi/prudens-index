import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies.js';

export const userRoleEnum = pgEnum('user_role', ['admin', 'client']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: varchar('clerk_user_id', { length: 128 }).notNull().unique(),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
