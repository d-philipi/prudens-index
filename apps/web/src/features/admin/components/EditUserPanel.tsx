'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { strings } from '@/lib/strings';
import type { AdminCompanyCardDto, AdminUserListItemDto } from '@prudens/shared/types';
import { updateUserSchema } from '../schemas/user-schemas';

interface EditUserPanelProps {
  user: AdminUserListItemDto;
  companies: AdminCompanyCardDto[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserPanel({ user, companies, onClose, onSaved }: EditUserPanelProps) {
  const { getToken } = useAuth();
  const [role, setRole] = useState<'admin' | 'client'>(user.role ?? 'client');
  const [companyId, setCompanyId] = useState(user.companyId ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBannerError(null);

    const parsed = updateUserSchema.safeParse({
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

      await apiFetch<AdminUserListItemDto>(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          role: parsed.data.role,
          companyId: parsed.data.role === 'client' ? parsed.data.companyId : null,
        }),
      });

      onSaved();
      onClose();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : strings.errors.uploadFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-slate-800">
        {strings.admin.editUser}: {user.email}
      </h4>

      {bannerError && (
        <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {bannerError}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{strings.admin.userEmail}</span>
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full cursor-not-allowed rounded border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
          />
          <span className="mt-1 block text-xs text-slate-500">{strings.admin.emailReadonly}</span>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">{strings.admin.userRole}</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as 'admin' | 'client');
              setFieldErrors({});
            }}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="admin">{strings.admin.roleAdmin}</option>
            <option value="client">{strings.admin.roleClient}</option>
          </select>
        </label>

        {role === 'client' && (
          <label className="block text-sm">
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

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? strings.admin.savingUser : strings.admin.saveUser}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            {strings.admin.cancelEdit}
          </button>
        </div>
      </form>
    </div>
  );
}
