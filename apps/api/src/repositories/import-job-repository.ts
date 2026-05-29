import { and, desc, eq } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { importJobs } from '../../drizzle/schema/import-jobs.js';

export const importJobRepository = {
  async create(data: typeof importJobs.$inferInsert) {
    const rows = await db.insert(importJobs).values(data).returning();
    return rows[0]!;
  },

  async findById(id: string) {
    const rows = await db.select().from(importJobs).where(eq(importJobs.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async findByCompany(companyId: string) {
    return db
      .select()
      .from(importJobs)
      .where(eq(importJobs.companyId, companyId))
      .orderBy(desc(importJobs.queuedAt));
  },

  async updateStatus(
    id: string,
    patch: Partial<typeof importJobs.$inferInsert>,
  ) {
    const rows = await db.update(importJobs).set(patch).where(eq(importJobs.id, id)).returning();
    return rows[0] ?? null;
  },

  async findProcessingByCompany(companyId: string) {
    const rows = await db
      .select()
      .from(importJobs)
      .where(
        and(
          eq(importJobs.companyId, companyId),
          eq(importJobs.status, 'processing'),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async deactivateActiveByCompany(companyId: string) {
    await db
      .update(importJobs)
      .set({ isActive: false })
      .where(and(eq(importJobs.companyId, companyId), eq(importJobs.isActive, true)));
  },

  async markActive(jobId: string) {
    const rows = await db
      .update(importJobs)
      .set({ isActive: true })
      .where(eq(importJobs.id, jobId))
      .returning();
    return rows[0] ?? null;
  },

  async findActiveByCompany(companyId: string) {
    const rows = await db
      .select()
      .from(importJobs)
      .where(and(eq(importJobs.companyId, companyId), eq(importJobs.isActive, true)))
      .limit(1);
    return rows[0] ?? null;
  },

  async listCompletedByCompany(companyId: string) {
    return db
      .select()
      .from(importJobs)
      .where(
        and(eq(importJobs.companyId, companyId), eq(importJobs.status, 'completed')),
      )
      .orderBy(desc(importJobs.completedAt));
  },
};
