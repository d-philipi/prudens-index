import type {
  AdminCompanyCardDto,
  AdminCompanyDetailDto,
  CompanyCreated,
  CreateCompanyRequest,
} from '@prudens/shared/types';
import { companyRepository } from '../repositories/company-repository.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { toImportJobDto } from '../lib/mappers.js';
import { normalizeCnpj } from '../lib/cnpj.js';
import { resolveUniqueSlug, slugifyCompanyName } from '../lib/slug.js';

function parseAvg(v: string | null): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

export const adminCompanyService = {
  async listCards(search?: string): Promise<AdminCompanyCardDto[]> {
    const rows = await companyRepository.listWithStats(search);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      productCount: Number(r.productCount),
      avgIdd: parseAvg(r.avgIdd),
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async getDetail(companyId: string): Promise<AdminCompanyDetailDto | null> {
    const company = await companyRepository.findById(companyId);
    if (!company) return null;

    const imports = await importJobRepository.findByCompany(companyId);
    const active = imports.find((j) => j.isActive);
    const stats = await companyRepository.detailStats(companyId);

    return {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        createdAt: company.createdAt.toISOString(),
        cnpj: company.cnpj,
        address: company.address,
        neighborhood: company.neighborhood,
        city: company.city,
        state: company.state,
        metadata: null,
      },
      stats: {
        totalProducts: Number(stats.totalProducts ?? 0),
        avgIdd: parseAvg(stats.avgIdd),
        lastUpdatedAt: toIsoOrNull(stats.lastUpdatedAt),
      },
      imports: imports.map(toImportJobDto),
      activeImportJobId: active?.id ?? null,
    };
  },

  async createCompany(input: CreateCompanyRequest): Promise<CompanyCreated> {
    const name = input.name.trim();
    if (name.length < 2) {
      throw Object.assign(new Error('Nome da empresa deve ter pelo menos 2 caracteres'), {
        statusCode: 400,
      });
    }

    const cnpj = normalizeCnpj(input.cnpj);
    if (cnpj) {
      const existing = await companyRepository.findByCnpj(cnpj);
      if (existing) {
        throw Object.assign(new Error('CNPJ já cadastrado'), { statusCode: 409 });
      }
    }

    const baseSlug = slugifyCompanyName(name);
    let slug: string;
    try {
      slug = await resolveUniqueSlug(baseSlug, (s) =>
        companyRepository.findBySlug(s).then((r) => r != null),
      );
    } catch (e) {
      const err = e as Error & { statusCode?: number };
      if (err.statusCode === 400) throw err;
      throw Object.assign(
        new Error('Não foi possível gerar um identificador único para a empresa'),
        { statusCode: 400 },
      );
    }

    const state =
      input.state?.trim().toUpperCase() && input.state.trim().length === 2
        ? input.state.trim().toUpperCase()
        : null;

    try {
      const row = await companyRepository.create({
        name,
        slug,
        cnpj,
        address: input.address?.trim() || null,
        neighborhood: input.neighborhood?.trim() || null,
        city: input.city?.trim() || null,
        state,
      });

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        cnpj: row.cnpj,
        address: row.address,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        createdAt: row.createdAt.toISOString(),
      };
    } catch (e) {
      const pg = e as { code?: string };
      if (pg.code === '23505') {
        throw Object.assign(new Error('CNPJ já cadastrado'), { statusCode: 409 });
      }
      throw e;
    }
  },
};
