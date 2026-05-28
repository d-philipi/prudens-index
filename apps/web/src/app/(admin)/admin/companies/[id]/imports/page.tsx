import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import type { AdminCompanyDetailDto } from '@prudens/shared/types';
import { strings } from '@/lib/strings';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCompanyImportsPage({ params }: PageProps) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  const { id } = await params;
  const detail = await apiFetch<AdminCompanyDetailDto>(`/api/admin/companies/${id}`, {
    token,
  }).catch(() => null);

  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Empresas', href: '/admin' },
          { label: detail.company.name, href: `/admin/companies/${detail.company.id}` },
          { label: 'Importações' },
        ]}
      />
      <Link href="/admin" className="inline-block rounded border px-3 py-1 text-sm">
        Voltar para empresas
      </Link>
      <section>
        <h2 className="mb-3 font-medium">Histórico de importações</h2>
        <ul className="divide-y rounded-lg border bg-white">
          {detail.imports.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span>{job.originalFilename}</span>
              <span className="text-slate-500">
                {strings.statusLabels[job.status]}
                {job.isActive ? ' · ativo' : ''}
                {job.rowCount != null ? ` · ${job.rowCount} linhas` : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
