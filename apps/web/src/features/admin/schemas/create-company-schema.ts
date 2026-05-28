import { z } from 'zod';

function normalizeCnpj(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length === 0 ? null : digits;
}

function isValidCnpjDigits(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
  const calc = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += Number(base[i]) * weights[i]!;
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return (
    calc(digits, w1) === Number(digits[12]) && calc(digits, w2) === Number(digits[13])
  );
}

export const createCompanySchema = z
  .object({
    name: z.string().trim().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
    cnpj: z.string().optional().transform(normalizeCnpj),
    address: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z
      .string()
      .optional()
      .transform((v) => (!v?.trim() ? null : v.trim().toUpperCase()))
      .refine((v) => v === null || /^[A-Z]{2}$/.test(v), 'UF deve ter 2 letras'),
  })
  .superRefine((data, ctx) => {
    if (data.cnpj && !isValidCnpjDigits(data.cnpj)) {
      ctx.addIssue({ code: 'custom', path: ['cnpj'], message: 'CNPJ inválido' });
    }
  });

export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;
