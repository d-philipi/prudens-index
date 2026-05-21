import '../src/lib/load-env.js';

import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db.js';
import { companies } from '../drizzle/schema/companies.js';
import { users } from '../drizzle/schema/users.js';

async function seed() {
  let inserted = await db
    .insert(companies)
    .values({ name: 'Demo Retail', slug: 'demo-retail' })
    .returning();
  const [company] = inserted;

  let demo = company;
  if (!demo) {
    const existing = await db.select().from(companies).where(eq(companies.slug, 'demo-retail')).limit(1);
    demo = existing[0];
  }

  if (!demo) throw new Error('Failed to seed company');

  for (const u of [
    {
      clerkUserId: process.env.SEED_ADMIN_CLERK_ID ?? 'user_admin_seed',
      email: 'admin@prudens.local',
      role: 'admin' as const,
      companyId: null,
    },
    {
      clerkUserId: process.env.SEED_CLIENT_CLERK_ID ?? 'user_client_seed',
      email: 'client@demo-retail.local',
      role: 'client' as const,
      companyId: demo.id,
    },
  ]) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, u.clerkUserId))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(users).values(u);
    }
  }

  console.log('Seed complete. Company:', demo.id);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
