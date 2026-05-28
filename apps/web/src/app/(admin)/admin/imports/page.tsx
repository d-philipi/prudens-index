'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { ImportUploadForm } from '@/components/ImportUploadForm';
import { ImportStatusPanel } from '@/components/ImportStatusPanel';
import { LoadingBlock } from '@/components/LoadingBlock';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { strings } from '@/lib/strings';
import type { AdminCompanyCardDto, ImportJobDto } from '@prudens/shared/types';

export default function AdminImportsPage() {
  const { getToken } = useAuth();
  const [companies, setCompanies] = useState<AdminCompanyCardDto[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [history, setHistory] = useState<ImportJobDto[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoadError(null);
      setCompaniesLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const list = await apiFetch<AdminCompanyCardDto[]>('/api/admin/companies', { token });
        setCompanies(list);
        if (list[0]) setSelectedCompany(list[0].id);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Erro ao carregar empresas');
      } finally {
        setCompaniesLoading(false);
      }
    })();
  }, [getToken]);

  useEffect(() => {
    if (!selectedCompany) return;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const jobs = await apiFetch<ImportJobDto[]>(
        `/api/admin/companies/${selectedCompany}/imports`,
        { token },
      );
      setHistory(jobs);
    })();
  }, [selectedCompany, getToken, importJobId]);

  return (
    <div>
      <Breadcrumb items={[{ label: strings.admin.companies, href: '/admin' }, { label: strings.admin.imports }]} />
      <h2 className="mb-4 text-lg font-medium">{strings.admin.uploadSpreadsheet}</h2>
      {loadError && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {loadError}
        </p>
      )}
      {companiesLoading ? (
        <LoadingBlock message={strings.admin.loadingCompanies} />
      ) : companies.length > 0 ? (
        <>
          {selectedCompany && (
            <p className="mb-3 text-sm text-slate-600">
              <Link href={`/admin/companies/${selectedCompany}/imports`} className="underline">
                {strings.admin.openCompanyImports}
              </Link>
            </p>
          )}
          <ImportUploadForm companies={companies} onUploadStarted={setImportJobId} />
        </>
      ) : (
        !loadError && (
          <p className="text-sm text-slate-600">{strings.admin.noCompanies}</p>
        )
      )}
      <ImportStatusPanel importJobId={importJobId} companyId={selectedCompany || null} />
      {history.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-2 font-medium">{strings.admin.importHistory}</h3>
          <ul className="space-y-1 text-sm">
            {history.map((j) => (
              <li key={j.id} className="rounded border bg-white px-3 py-2">
                {j.originalFilename} — {strings.statusLabels[j.status]}
                {j.completedAt && ` (${new Date(j.completedAt).toLocaleString()})`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
