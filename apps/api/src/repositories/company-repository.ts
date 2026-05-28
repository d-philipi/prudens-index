import { and, count, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { companies } from '../../drizzle/schema/companies.js';
import { importJobs } from '../../drizzle/schema/import-jobs.js';
import { stockProducts } from '../../drizzle/schema/stock-products.js';

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

  async findByCnpj(cnpj: string) {
    const rows = await db.select().from(companies).where(eq(companies.cnpj, cnpj)).limit(1);
    return rows[0] ?? null;
  },

  async create(data: {
    name: string;
    slug: string;
    cnpj?: string | null;
    address?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
  }) {
    const [row] = await db
      .insert(companies)
      .values({
        name: data.name,
        slug: data.slug,
        cnpj: data.cnpj ?? null,
        address: data.address ?? null,
        neighborhood: data.neighborhood ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
      })
      .returning();
    return row!;
  },

  async listWithStats(search?: string) {
    const searchClause = search?.trim()
      ? ilike(companies.name, `%${search.trim()}%`)
      : undefined;

    let query = db
      .select({
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        createdAt: companies.createdAt,
        productCount: sql<number>`coalesce(count(${stockProducts.id}), 0)::int`,
        avgIdd: sql<string | null>`avg(${stockProducts.idd}::numeric)`,
      })
      .from(companies)
      .leftJoin(
        importJobs,
        and(eq(importJobs.companyId, companies.id), eq(importJobs.isActive, true)),
      )
      .leftJoin(
        stockProducts,
        and(
          eq(stockProducts.companyId, companies.id),
          eq(stockProducts.importJobId, importJobs.id),
        ),
      )
      .$dynamic();

    if (searchClause) {
      query = query.where(searchClause);
    }

    const rows = await query
      .groupBy(companies.id, companies.name, companies.slug, companies.createdAt)
      .orderBy(companies.name);

    return rows;
  },

  async avgIddGroupedByCompany() {
    return db
      .select({
        companyId: companies.id,
        companyName: companies.name,
        avgIdd: sql<string | null>`avg(${stockProducts.idd}::numeric)`,
      })
      .from(companies)
      .leftJoin(
        importJobs,
        and(eq(importJobs.companyId, companies.id), eq(importJobs.isActive, true)),
      )
      .leftJoin(
        stockProducts,
        and(
          eq(stockProducts.companyId, companies.id),
          eq(stockProducts.importJobId, importJobs.id),
        ),
      )
      .groupBy(companies.id, companies.name)
      .orderBy(companies.name);
  },

  async countCompanies() {
    const [row] = await db.select({ total: count() }).from(companies);
    return Number(row?.total ?? 0);
  },

  async countAllActiveProducts() {
    const [row] = await db
      .select({ total: count() })
      .from(stockProducts)
      .innerJoin(importJobs, eq(stockProducts.importJobId, importJobs.id))
      .where(eq(importJobs.isActive, true));
    return Number(row?.total ?? 0);
  },

  async detailStats(companyId: string) {
    const rows = await db
      .select({
        totalProducts: sql<number>`coalesce(count(${stockProducts.id}), 0)::int`,
        avgIdd: sql<string | null>`avg(${stockProducts.idd}::numeric)`,
        lastUpdatedAt: sql<Date | null>`max(${importJobs.completedAt})`,
      })
      .from(companies)
      .leftJoin(
        importJobs,
        and(eq(importJobs.companyId, companies.id), eq(importJobs.isActive, true)),
      )
      .leftJoin(
        stockProducts,
        and(eq(stockProducts.companyId, companies.id), eq(stockProducts.importJobId, importJobs.id)),
      )
      .where(eq(companies.id, companyId))
      .groupBy(companies.id);

    return rows[0] ?? { totalProducts: 0, avgIdd: null, lastUpdatedAt: null };
  },
};
