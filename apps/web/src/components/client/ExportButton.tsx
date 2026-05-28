'use client';

import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import type { ItemStatus } from '@prudens/shared/types';

interface Props {
  term: string;
  itemStatuses: ItemStatus[];
}

export function ExportButton({ term, itemStatuses }: Props) {
  const { getToken } = useAuth();

  const exportPdf = async () => {
    const token = await getToken();
    if (!token) return;
    const blob = await apiFetch<Blob>('/api/client/export-pdf', {
      method: 'POST',
      token,
      body: JSON.stringify({ term: term || undefined, itemStatuses }),
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-report.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={exportPdf}
      className="w-full rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
    >
      Exportar PDF
    </button>
  );
}
