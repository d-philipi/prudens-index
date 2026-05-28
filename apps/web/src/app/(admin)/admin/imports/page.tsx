'use client';

import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { ImportUploadForm } from '@/components/ImportUploadForm';
import { ImportStatusPanel } from '@/components/ImportStatusPanel';
import { LoadingBlock } from '@/components/LoadingBlock';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { strings } from '@/lib/strings';
import type { AdminCompanyCardDto, ImportJobDto } from '@prudens/shared/types';

function AdminImportsPageContent() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<AdminCompanyCardDto[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [history, setHistory] = useState<ImportJobDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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
        const fromUrl = searchParams.get('company');
        const initial =
          fromUrl && list.some((c) => c.id === fromUrl) ? fromUrl : (list[0]?.id ?? '');
        setSelectedCompany(initial);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Erro ao carregar empresas');
      } finally {
        setCompaniesLoading(false);
      }
    })();
  }, [getToken, searchParams]);

  useEffect(() => {
    if (!selectedCompany) {
      setHistory([]);
      return;
    }
    let active = true;
    (async () => {
      setHistoryLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const jobs = await apiFetch<ImportJobDto[]>(
          `/api/admin/companies/${selectedCompany}/imports`,
          { token },
        );
        if (active) setHistory(jobs);
      } catch {
        if (active) setHistory([]);
      } finally {
        if (active) setHistoryLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedCompany, getToken, importJobId]);

  const selectedCompanyName = companies.find((c) => c.id === selectedCompany)?.name;

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
        <ImportUploadForm
          companies={companies}
          companyId={selectedCompany}
          onCompanyChange={setSelectedCompany}
          onUploadStarted={setImportJobId}
        />
      ) : (
        !loadError && (
          <p className="text-sm text-slate-600">{strings.admin.noCompanies}</p>
        )
      )}
      <ImportStatusPanel importJobId={importJobId} companyId={selectedCompany || null} />
      {selectedCompany && (
        <section className="mt-8">
          <h3 className="mb-2 font-medium">
            {strings.admin.importHistory}
            {selectedCompanyName ? (
              <span className="font-normal text-slate-600"> — {selectedCompanyName}</span>
            ) : null}
          </h3>
          {historyLoading ? (
            <p className="text-sm text-slate-500">{strings.common.loading}</p>
          ) : history.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {history.map((j) => (
                <li key={j.id} className="rounded border bg-white px-3 py-2">
                  {j.originalFilename} — {strings.statusLabels[j.status]}
                  {j.isActive ? ' · ativo' : ''}
                  {j.rowCount != null ? ` · ${j.rowCount} linhas` : ''}
                  {j.completedAt && ` · ${new Date(j.completedAt).toLocaleString('pt-BR')}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{strings.admin.noImportsForCompany}</p>
          )}
        </section>
      )}
    </div>
  );
}

export default function AdminImportsPage() {
  return (
    <Suspense fallback={<LoadingBlock message={strings.admin.loadingCompanies} />}>
      <AdminImportsPageContent />
    </Suspense>
  );
}
