import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import type { AdminCompanyDetailDto } from '@prudens/shared/types';
import { CompanyOverview } from '@/features/admin/components/CompanyOverview';
import { strings } from '@/lib/strings';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCompanyDetailPage({ params }: PageProps) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  const { id } = await params;
  let detail: AdminCompanyDetailDto | null = null;
  let fetchErrorMessage: string | null = null;
  try {
    detail = await apiFetch<AdminCompanyDetailDto>(`/api/admin/companies/${id}`, {
      token,
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Erro desconhecido ao buscar empresa.';
    const message = rawMessage.toLowerCase();
    if (message.includes('404') || message.includes('not found') || message.includes('não encontrada')) {
      notFound();
    }
    fetchErrorMessage = rawMessage;
  }
  if (!detail && fetchErrorMessage) {
    return (
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'Empresas', href: '/admin' },
            { label: 'Falha ao carregar empresa' },
          ]}
        />
        <Link href="/admin" className="text-sm text-slate-600 underline">
          ← Voltar para empresas
        </Link>
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h1 className="text-base font-semibold text-red-800">Erro ao carregar dados da empresa</h1>
          <p className="mt-2 text-sm text-red-900">
            Não foi possível buscar as informações da empresa <span className="font-mono">{id}</span>.
          </p>
          <p className="mt-2 text-sm text-red-900">
            Motivo retornado pela API: <span className="font-medium">{fetchErrorMessage}</span>
          </p>
        </section>
      </div>
    );
  }
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Empresas', href: '/admin' },
          { label: detail.company.name },
        ]}
      />
      <Link href="/admin" className="text-sm text-slate-600 underline">
        ← Voltar
      </Link>
      <CompanyOverview detail={detail} />
      <section className="rounded-lg border bg-white p-4">
        <h2 className="font-medium">Fonte ativa do dashboard do cliente</h2>
        {detail.activeImportJobId ? (
          <p className="mt-2 text-sm text-green-800">
            Job ativo: {detail.activeImportJobId}
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-700">Nenhuma importação ativa.</p>
        )}
      </section>
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Histórico de importações</h2>
          <Link
            href={`/admin/imports?company=${detail.company.id}`}
            className="text-sm text-slate-600 underline"
          >
            {strings.admin.importSpreadsheetForCompany}
          </Link>
        </div>
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
