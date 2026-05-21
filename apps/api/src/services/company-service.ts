import type { CompanyDto } from '@prudens/shared/types';
import { companyRepository } from '../repositories/company-repository.js';

export const companyService = {
  async listForAdmin(): Promise<CompanyDto[]> {
    const rows = await companyRepository.findAll();
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));
  },
};
