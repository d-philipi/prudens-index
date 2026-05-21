'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import type { ImportJobDto } from '@prudens/shared/types';

interface Props {
  importJobId: string | null;
}

export function ImportStatusPanel({ importJobId }: Props) {
  const { getToken } = useAuth();
  const [job, setJob] = useState<ImportJobDto | null>(null);

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
  }, [importJobId, getToken]);

  if (!importJobId || !job) return null;

  return (
    <div className="mt-4 rounded border border-slate-200 bg-white p-4 text-sm">
      <p>
        <span className="font-medium">Status:</span> {job.status}
      </p>
      {job.rowCount != null && <p>Linhas: {job.rowCount}</p>}
      {job.errorMessage && <p className="text-red-600">{job.errorMessage}</p>}
      {job.status === 'completed' && (
        <p className="mt-2 text-green-700">Dados disponíveis no dashboard do cliente.</p>
      )}
    </div>
  );
}
