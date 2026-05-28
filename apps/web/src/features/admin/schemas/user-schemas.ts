import { z } from 'zod';

export const inviteUserSchema = z
  .object({
    email: z.string().trim().email('E-mail inválido'),
    role: z.enum(['admin', 'client']),
    companyId: z.string().uuid().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'client' && !data.companyId) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyId'],
        message: 'Selecione uma empresa para o perfil Cliente',
      });
    }
  });

export const updateUserSchema = z
  .object({
    role: z.enum(['admin', 'client']),
    companyId: z.string().uuid().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'client' && !data.companyId) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyId'],
        message: 'Selecione uma empresa para o perfil Cliente',
      });
    }
  });

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
