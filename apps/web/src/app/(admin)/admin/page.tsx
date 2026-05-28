import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { MetricsPanel } from '@/components/admin/MetricsPanel';
import { CompanySearch } from '@/components/admin/CompanySearch';
import { CompanyCard } from '@/components/admin/CompanyCard';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { strings } from '@/lib/strings';
import type { AdminCompanyCardDto, AdminMetricsDto } from '@prudens/shared/types';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminHomePage({ searchParams }: PageProps) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) redirect('/sign-in');

  const { q } = await searchParams;
  const qParam = q ? `?q=${encodeURIComponent(q)}` : '';

  const [metrics, companies] = await Promise.all([
    apiFetch<AdminMetricsDto>('/api/admin/metrics', { token }),
    apiFetch<AdminCompanyCardDto[]>(`/api/admin/companies${qParam}`, { token }),
  ]);

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: strings.admin.companies }]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/companies/new"
          className="rounded border border-brand bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {strings.admin.newCompany}
        </Link>
        <p className="text-sm text-text-subtitle">
          <Link href="/admin/imports" className="underline">
            {strings.admin.uploadSpreadsheet}
          </Link>
        </p>
      </div>
      <MetricsPanel metrics={metrics} />
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{strings.admin.companies}</h2>
        <CompanySearch />
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
        {companies.length === 0 && (
          <p className="text-sm text-text-subtitle">Nenhuma empresa encontrada.</p>
        )}
      </section>
    </div>
  );
}
