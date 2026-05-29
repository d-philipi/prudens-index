import type { ActiveFileExportResponseDto } from '@prudens/shared/types';
import type { AuthContext } from '../types/auth-context.js';
import { assertClient } from './auth-context-service.js';
import { importJobRepository } from '../repositories/import-job-repository.js';
import { r2StorageService } from './r2-storage-service.js';

const EXPORT_URL_TTL_SECONDS = 60;

export const clientExportService = {
  async getActiveFileExport(
    ctx: AuthContext,
  ): Promise<ActiveFileExportResponseDto> {
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

    return {
      url,
      filename: active.originalFilename,
    };
  },
};
