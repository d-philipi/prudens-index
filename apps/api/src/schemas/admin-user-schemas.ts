import { z } from 'zod';

export const inviteUserBodySchema = z
  .object({
    email: z.string().trim().email('E-mail inválido'),
    role: z.enum(['admin', 'client']),
    companyId: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'client' && !data.companyId) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyId'],
        message: 'Empresa é obrigatória para perfil Cliente',
      });
    }
    if (data.role === 'admin' && data.companyId) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyId'],
        message: 'Administrador não deve ter empresa vinculada',
      });
    }
  });

export const updateUserBodySchema = z
  .object({
    role: z.enum(['admin', 'client']),
    companyId: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'client' && !data.companyId) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyId'],
        message: 'Empresa é obrigatória para perfil Cliente',
      });
    }
  });

export type InviteUserBody = z.infer<typeof inviteUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
