'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { strings } from '@/lib/strings';
import type { AdminCompanyCardDto, InviteUserResponse } from '@prudens/shared/types';
import { inviteUserSchema } from '../schemas/user-schemas';

interface InviteUserFormProps {
  companies: AdminCompanyCardDto[];
  onSuccess: () => void;
}

export function InviteUserForm({ companies, onSuccess }: InviteUserFormProps) {
  const { getToken } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'client'>('client');
  const [companyId, setCompanyId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBannerError(null);
    setSuccess(null);

    const parsed = inviteUserSchema.safeParse({
      email,
      role,
      companyId: role === 'client' ? companyId : undefined,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Usuário não autenticado');

      await apiFetch<InviteUserResponse>('/api/admin/users', {
        method: 'POST',
        token,
        body: JSON.stringify({
          email: parsed.data.email,
          role: parsed.data.role,
          companyId: parsed.data.role === 'client' ? parsed.data.companyId : null,
        }),
      });

      setEmail('');
      setCompanyId('');
      setSuccess(strings.admin.inviteSuccess);
      onSuccess();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : strings.errors.uploadFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800">Convidar usuário</h3>

      {bannerError && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {bannerError}
        </p>
      )}
      {success && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
          {success}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{strings.admin.userEmail}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((f) => ({ ...f, email: '' }));
            }}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            autoComplete="email"
          />
          {fieldErrors.email && <span className="mt-1 block text-xs text-red-600">{fieldErrors.email}</span>}
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{strings.admin.userRole}</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as 'admin' | 'client');
              setFieldErrors((f) => ({ ...f, companyId: '' }));
            }}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="admin">{strings.admin.roleAdmin}</option>
            <option value="client">{strings.admin.roleClient}</option>
          </select>
        </label>

        {role === 'client' && (
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">{strings.admin.userCompany}</span>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setFieldErrors((f) => ({ ...f, companyId: '' }));
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione uma empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.companyId && (
              <span className="mt-1 block text-xs text-red-600">{fieldErrors.companyId}</span>
            )}
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? strings.admin.invitingUser : strings.admin.inviteUser}
      </button>
    </form>
  );
}
