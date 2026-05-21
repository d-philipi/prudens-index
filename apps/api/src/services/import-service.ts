import type { AuthContext } from '../types/auth-context.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { companyRepository } from '../repositories/company-repository.js';
import { r2StorageService } from './r2-storage-service.js';
import { spreadsheetValidationService } from './spreadsheet-validation-service.js';
import { queueService } from './queue-service.js';
import { toImportJobDto } from '../lib/mappers.js';

export const importService = {
  async createUpload(
    ctx: AuthContext,
    input: { companyId: string; filename: string; contentType: string; sizeBytes: number },
  ) {
    const meta = spreadsheetValidationService.validateUploadMeta(input);
    if (!meta.ok) {
      throw Object.assign(new Error(meta.message), { statusCode: 400, code: meta.code });
    }

    const company = await companyRepository.findById(input.companyId);
    if (!company) {
      throw Object.assign(new Error('Company not found'), { statusCode: 404 });
    }

    const inFlight = await importJobRepository.findProcessingByCompany(input.companyId);
    if (inFlight) {
      throw Object.assign(new Error('Import already processing for this company'), {
        statusCode: 409,
      });
    }

    const job = await importJobRepository.create({
      companyId: input.companyId,
      uploadedByUserId: ctx.userId,
      status: 'queued',
      originalFilename: input.filename,
      r2ObjectKey: '',
      isActive: false,
    });

    const objectKey = r2StorageService.buildObjectKey(
      input.companyId,
      job.id,
      input.filename,
    );
    await importJobRepository.updateStatus(job.id, { r2ObjectKey: objectKey });

    const uploadUrl = await r2StorageService.getPresignedPutUrl(objectKey, input.contentType);

    return {
      importJobId: job.id,
      uploadUrl,
      uploadHeaders: { 'Content-Type': input.contentType },
    };
  },

  async completeUpload(importJobId: string) {
    const job = await importJobRepository.findById(importJobId);
    if (!job) {
      throw Object.assign(new Error('Not found'), { statusCode: 404 });
    }
    await queueService.enqueueProcessImport(importJobId);
    return { queued: true };
  },

  async getJob(importJobId: string) {
    const job = await importJobRepository.findById(importJobId);
    if (!job) throw Object.assign(new Error('Not found'), { statusCode: 404 });
    return toImportJobDto(job);
  },

  async listByCompany(companyId: string) {
    const jobs = await importJobRepository.findByCompany(companyId);
    return jobs.map(toImportJobDto);
  },
};
