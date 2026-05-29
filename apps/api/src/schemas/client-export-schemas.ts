import { z } from 'zod';

export const exportJobIdParamsSchema = z.object({
  jobId: z.string().uuid(),
});

export const exportFileQuerySchema = z.object({
  format: z.string().optional(),
});

export const exportVersionsQuerySchema = z.object({});
