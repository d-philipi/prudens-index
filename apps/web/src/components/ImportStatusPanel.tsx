'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import type { ImportJobDto, ImportValidationError } from '@prudens/shared/types';
import { ValidationErrorList } from './admin/ValidationErrorList';
import { strings } from '@/lib/strings';

interface Props {
  importJobId: string | null;
  companyId?: string | null;
}

export function ImportStatusPanel({ importJobId, companyId }: Props) {
  const { getToken } = useAuth();
  const [job, setJob] = useState<ImportJobDto | null>(null);
  const [errors, setErrors] = useState<ImportValidationError[]>([]);

  useEffect(() => {
    if (!importJobId) return;
    let active = true;

    const poll = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const data = await apiFetch<ImportJobDto>(`/api/admin/imports/${importJobId}`, {
          token,
        });
        if (active) setJob(data);
        if (active && companyId && data.validationErrors.length === 0 && data.status !== 'queued' && data.status !== 'processing') {
          const details = await apiFetch<{ errors: ImportValidationError[] }>(
            `/api/admin/companies/${companyId}/jobs/${importJobId}/errors`,
            { token },
          );
          setErrors(details.errors);
        } else if (active) {
          setErrors(data.validationErrors);
        }
        if (data.status === 'queued' || data.status === 'processing') {
          setTimeout(poll, 2000);
        }
      } catch {
        /* ignore poll errors */
      }
    };

    poll();
    return () => {
      active = false;
    };
  }, [importJobId, companyId, getToken]);

  if (!importJobId || !job) return null;
  const statusLabel = strings.statusLabels[job.status];

  return (
    <div className="mt-4 rounded border border-slate-200 bg-white p-4 text-sm">
      <p>
        <span className="font-medium">{strings.common.status}:</span> {statusLabel}
      </p>
      {job.rowCount != null && <p>Linhas: {job.rowCount}</p>}
      {job.errorMessage && <p className="text-red-600">{job.errorMessage}</p>}
      {errors.length > 0 && <ValidationErrorList errors={errors} />}
      {job.status === 'completed' && (
        <p className="mt-2 text-green-700">Dados disponíveis no painel do cliente.</p>
      )}
    </div>
  );
}
