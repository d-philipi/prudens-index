import { eq } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { companies } from '../../drizzle/schema/companies.js';

export const companyRepository = {
  async findAll() {
    return db.select().from(companies).orderBy(companies.name);
  },

  async findById(id: string) {
    const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async findBySlug(slug: string) {
    const rows = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
    return rows[0] ?? null;
  },
};
