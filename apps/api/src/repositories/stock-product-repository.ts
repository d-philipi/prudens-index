import { and, eq } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { stockProducts } from '../../drizzle/schema/stock-products.js';

export const stockProductRepository = {
  async bulkInsert(rows: (typeof stockProducts.$inferInsert)[]) {
    if (rows.length === 0) return;
    await db.insert(stockProducts).values(rows);
  },

  async findByActiveImport(companyId: string, importJobId: string) {
    return db
      .select()
      .from(stockProducts)
      .where(
        and(eq(stockProducts.companyId, companyId), eq(stockProducts.importJobId, importJobId)),
      );
  },

  async findByIds(companyId: string, ids: string[]) {
    if (ids.length === 0) return [];
    const all = await db
      .select()
      .from(stockProducts)
      .where(eq(stockProducts.companyId, companyId));
    const set = new Set(ids);
    return all.filter((r) => set.has(r.id));
  },
};
