import { eq } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { users } from '../../drizzle/schema/users.js';

export const userRepository = {
  async findByClerkId(clerkUserId: string) {
    const rows = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    return rows[0] ?? null;
  },
};
