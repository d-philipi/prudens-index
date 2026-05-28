import type { ImportValidationError } from '@prudens/shared/types';
import { importJobRepository } from '../repositories/import-job-repository.js';

export const importErrorsService = {
  async getByCompanyAndJob(
    companyId: string,
    jobId: string,
  ): Promise<{ jobId: string; companyId: string; errors: ImportValidationError[] }> {
    const job = await importJobRepository.findById(jobId);
    if (!job || job.companyId !== companyId) {
      throw Object.assign(new Error('Job não encontrado para a empresa informada'), {
        statusCode: 404,
      });
    }

    return {
      jobId: job.id,
      companyId: job.companyId,
      errors: Array.isArray(job.validationErrors)
        ? (job.validationErrors as ImportValidationError[])
        : [],
    };
  },
};
