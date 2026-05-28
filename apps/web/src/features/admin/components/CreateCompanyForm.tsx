'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { strings } from '@/lib/strings';
import type { CompanyCreated } from '@prudens/shared/types';
import {
  createCompanySchema,
  type CreateCompanyFormValues,
} from '../schemas/create-company-schema';

type FieldErrors = Partial<Record<keyof CreateCompanyFormValues | 'cnpj', string>>;

interface FormState {
  name: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
}

const emptyForm: FormState = {
  name: '',
  cnpj: '',
  address: '',
  neighborhood: '',
  city: '',
  state: '',
};

export function CreateCompanyForm() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof FormState, value: string) => {
    setForm((f: FormState) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
    setBannerError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBannerError(null);

    const parsed = createCompanySchema.safeParse({
      name: form.name,
      cnpj: form.cnpj || undefined,
      address: form.address || undefined,
      neighborhood: form.neighborhood || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CreateCompanyFormValues;
        if (key && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Usuário não autenticado');

      const created = await apiFetch<CompanyCreated>('/api/admin/companies', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: parsed.data.name,
          cnpj: parsed.data.cnpj,
          address: parsed.data.address?.trim() || null,
          neighborhood: parsed.data.neighborhood?.trim() || null,
          city: parsed.data.city?.trim() || null,
          state: parsed.data.state,
        }),
      });

      router.push(`/admin/imports?company=${created.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar empresa';
      if (message.includes('CNPJ já cadastrado')) {
        setFieldErrors({ cnpj: strings.admin.cnpjDuplicate });
      } else {
        setBannerError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-lg border bg-white p-6">
      {bannerError && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {bannerError}
        </p>
      )}

      <div>
        <label htmlFor="company-name" className="text-sm font-medium">
          {strings.admin.companyName} *
        </label>
        <input
          id="company-name"
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          autoComplete="organization"
        />
        {fieldErrors.name && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="company-cnpj" className="text-sm font-medium">
          {strings.admin.companyCnpj}
        </label>
        <input
          id="company-cnpj"
          type="text"
          value={form.cnpj}
          onChange={(e) => update('cnpj', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          placeholder="00.000.000/0000-00"
        />
        {fieldErrors.cnpj && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.cnpj}</p>
        )}
      </div>

      <div>
        <label htmlFor="company-address" className="text-sm font-medium">
          {strings.admin.companyAddress}
        </label>
        <input
          id="company-address"
          type="text"
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company-neighborhood" className="text-sm font-medium">
            {strings.admin.companyNeighborhood}
          </label>
          <input
            id="company-neighborhood"
            type="text"
            value={form.neighborhood}
            onChange={(e) => update('neighborhood', e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="company-city" className="text-sm font-medium">
            {strings.admin.companyCity}
          </label>
          <input
            id="company-city"
            type="text"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="w-24">
        <label htmlFor="company-state" className="text-sm font-medium">
          {strings.admin.companyState}
        </label>
        <input
          id="company-state"
          type="text"
          maxLength={2}
          value={form.state}
          onChange={(e) => update('state', e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm uppercase"
        />
        {fieldErrors.state && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.state}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? strings.admin.creatingCompany : strings.admin.createCompany}
      </button>
    </form>
  );
}
