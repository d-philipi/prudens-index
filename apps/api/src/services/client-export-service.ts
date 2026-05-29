import type {
  ActiveFileExportResponseDto,
  ClientExportVersionsDto,
} from '@prudens/shared/types';
import type { AuthContext } from '../types/auth-context.js';
import { assertClient } from './auth-context-service.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { r2StorageService } from './r2-storage-service.js';

const EXPORT_URL_TTL_SECONDS = 60;

export const clientExportService = {
  async getActiveFileExport(ctx: AuthContext): Promise<ActiveFileExportResponseDto> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const active = await importJobRepository.findActiveByCompany(companyId);

    if (!active || active.status !== 'completed' || !active.r2ObjectKey) {
      const err = new Error('Não há planilha ativa para exportar.') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    const url = await r2StorageService.getPresignedGetUrl(
      active.r2ObjectKey,
      EXPORT_URL_TTL_SECONDS,
    );

    return { url, filename: active.originalFilename };
  },

  async listVersions(ctx: AuthContext): Promise<ClientExportVersionsDto> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const active = await importJobRepository.findActiveByCompany(companyId);
    const completed = await importJobRepository.listCompletedByCompany(companyId);

    const history = completed
      .filter((j) => !j.isActive && j.r2ObjectKey)
      .map((j) => ({
        jobId: j.id,
        filename: j.originalFilename,
        completedAt: j.completedAt?.toISOString() ?? null,
        isActive: false,
      }));

    const activeDto =
      active && active.status === 'completed' && active.r2ObjectKey
        ? {
            jobId: active.id,
            filename: active.originalFilename,
            completedAt: active.completedAt?.toISOString() ?? null,
            isActive: true,
          }
        : null;

    return { active: activeDto, history };
  },

  async getFileByJobId(ctx: AuthContext, jobId: string): Promise<ActiveFileExportResponseDto> {
    assertClient(ctx);
    const companyId = ctx.companyId!;
    const job = await importJobRepository.findById(jobId);

    if (!job || job.companyId !== companyId) {
      const err = new Error('Importação não encontrada.') as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }

    if (job.status !== 'completed' || !job.r2ObjectKey) {
      const err = new Error('Arquivo não disponível para esta importação.') as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }

    const url = await r2StorageService.getPresignedGetUrl(job.r2ObjectKey, EXPORT_URL_TTL_SECONDS);
    return { url, filename: job.originalFilename };
  },
};
