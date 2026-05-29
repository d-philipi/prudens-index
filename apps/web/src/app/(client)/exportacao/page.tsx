import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { ExportView } from '@/components/client/ExportView';
import type { ClientExportVersionsDto } from '@prudens/shared/types';

export default async function ExportacaoPage() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/login');

  const versions = await apiFetch<ClientExportVersionsDto>('/api/client/export/versions', {
    token,
  }).catch(() => ({ active: null, history: [] }));

  return <ExportView initialVersions={versions} />;
}
