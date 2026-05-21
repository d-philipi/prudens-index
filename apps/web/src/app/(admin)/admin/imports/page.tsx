'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { ImportUploadForm } from '@/components/ImportUploadForm';
import { ImportStatusPanel } from '@/components/ImportStatusPanel';
import { LoadingBlock } from '@/components/LoadingBlock';
import type { CompanyDto, ImportJobDto } from '@prudens/shared/types';

export default function AdminImportsPage() {
  const { getToken } = useAuth();
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
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
        const list = await apiFetch<CompanyDto[]>('/api/admin/companies', { token });
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
      <h2 className="mb-4 text-lg font-medium">Importar planilha de estoque</h2>
      {loadError && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {loadError}
        </p>
      )}
      {companiesLoading ? (
        <LoadingBlock message="Carregando empresas…" />
      ) : companies.length > 0 ? (
        <ImportUploadForm companies={companies} onUploadStarted={setImportJobId} />
      ) : (
        !loadError && (
          <p className="text-sm text-slate-600">Nenhuma empresa cadastrada.</p>
        )
      )}
      <ImportStatusPanel importJobId={importJobId} />
      {history.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-2 font-medium">Histórico de imports</h3>
          <ul className="space-y-1 text-sm">
            {history.map((j) => (
              <li key={j.id} className="rounded border bg-white px-3 py-2">
                {j.originalFilename} — {j.status}
                {j.completedAt && ` (${new Date(j.completedAt).toLocaleString()})`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
