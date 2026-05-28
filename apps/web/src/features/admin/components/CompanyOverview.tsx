import type { AdminCompanyDetailDto } from '@prudens/shared/types';

interface Props {
  detail: AdminCompanyDetailDto;
}

export function CompanyOverview({ detail }: Props) {
  const { company, stats } = detail;
  const metaEntries = Object.entries(company.metadata ?? {});

  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="text-lg font-semibold">{company.name}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Cadastro: {new Date(company.createdAt).toLocaleDateString('pt-BR')} · slug: {company.slug}
      </p>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <p>Total de produtos: {stats.totalProducts}</p>
        <p>IDD médio: {stats.avgIdd == null ? '—' : `${stats.avgIdd.toFixed(2)}%`}</p>
        <p>
          Última atualização:{' '}
          {stats.lastUpdatedAt ? new Date(stats.lastUpdatedAt).toLocaleString('pt-BR') : '—'}
        </p>
      </div>
      {metaEntries.length > 0 && (
        <div className="mt-3 text-sm text-slate-700">
          {metaEntries.map(([k, v]) => (
            <p key={k}>
              {k}: {String(v ?? '—')}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
