import type { AdminCompanyCardDto, AdminCompanyDetailDto } from '@prudens/shared/types';
import { companyRepository } from '../repositories/company-repository.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { toImportJobDto } from '../lib/mappers.js';

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
};
