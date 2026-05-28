import type { AdminCompanyDetailDto } from '@prudens/shared/types';

interface Props {
  detail: AdminCompanyDetailDto;
}

function formatCnpjDisplay(cnpj: string): string {
  if (cnpj.length !== 14) return cnpj;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

export function CompanyOverview({ detail }: Props) {
  const { company, stats } = detail;
  const hasAddress =
    company.address || company.neighborhood || company.city || company.state;

  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="text-lg font-semibold">{company.name}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Cadastro: {new Date(company.createdAt).toLocaleDateString('pt-BR')} · slug: {company.slug}
      </p>
      {(company.cnpj || hasAddress) && (
        <div className="mt-3 space-y-1 text-sm text-slate-700">
          {company.cnpj && <p>CNPJ: {formatCnpjDisplay(company.cnpj)}</p>}
          {company.address && <p>Endereço: {company.address}</p>}
          {(company.neighborhood || company.city || company.state) && (
            <p>
              {[company.neighborhood, company.city, company.state].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      )}
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <p>Total de produtos: {stats.totalProducts}</p>
        <p>IDD médio: {stats.avgIdd == null ? '—' : `${stats.avgIdd.toFixed(2)}%`}</p>
        <p>
          Última atualização:{' '}
          {stats.lastUpdatedAt ? new Date(stats.lastUpdatedAt).toLocaleString('pt-BR') : '—'}
        </p>
      </div>
    </section>
  );
}
