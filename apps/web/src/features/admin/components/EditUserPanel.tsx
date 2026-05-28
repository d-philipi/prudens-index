'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { strings } from '@/lib/strings';
import type { AdminCompanyCardDto, AdminUserListItemDto } from '@prudens/shared/types';
import { SelectField } from '@/components/shared/SelectField';
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
    <div className="rounded-lg border border-border-default bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-brand">
        {strings.admin.editUser}: {user.email}
      </h4>

      {bannerError && (
        <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {bannerError}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-brand">{strings.admin.userEmail}</span>
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full cursor-not-allowed rounded border border-border-default bg-surface-page px-3 py-2 text-sm text-text-subtitle"
          />
          <span className="mt-1 block text-xs text-text-subtitle">{strings.admin.emailReadonly}</span>
        </label>

        <SelectField
          label={strings.admin.userRole}
          value={role}
          onChange={(v) => {
            setRole(v as 'admin' | 'client');
            setFieldErrors({});
          }}
          options={[
            { value: 'admin', label: strings.admin.roleAdmin },
            { value: 'client', label: strings.admin.roleClient },
          ]}
        />

        {role === 'client' && (
          <SelectField
            label={strings.admin.userCompany}
            value={companyId}
            placeholder="Selecione uma empresa"
            onChange={(v) => {
              setCompanyId(v);
              setFieldErrors((f) => ({ ...f, companyId: '' }));
            }}
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            error={fieldErrors.companyId}
          />
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? strings.admin.savingUser : strings.admin.saveUser}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border-default px-4 py-2 text-sm text-brand"
          >
            {strings.admin.cancelEdit}
          </button>
        </div>
      </form>
    </div>
  );
}
