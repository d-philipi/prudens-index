import { eq } from 'drizzle-orm';
import type { UserRole } from '@prudens/shared/types';
import { db } from '../lib/db.js';
import { users } from '../../drizzle/schema/users.js';

export const userRepository = {
  async findByClerkId(clerkUserId: string) {
    const rows = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    return rows[0] ?? null;
  },

  async upsertByClerkId(data: {
    clerkUserId: string;
    email: string;
    role: UserRole;
    companyId: string | null;
  }) {
    const existing = await this.findByClerkId(data.clerkUserId);
    if (existing) {
      const [row] = await db
        .update(users)
        .set({
          email: data.email,
          role: data.role,
          companyId: data.companyId,
        })
        .where(eq(users.clerkUserId, data.clerkUserId))
        .returning();
      return row!;
    }
    const [row] = await db
      .insert(users)
      .values({
        clerkUserId: data.clerkUserId,
        email: data.email,
        role: data.role,
        companyId: data.companyId,
      })
      .returning();
    return row!;
  },
};
