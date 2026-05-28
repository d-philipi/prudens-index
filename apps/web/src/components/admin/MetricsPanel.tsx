import type { AdminMetricsDto } from '@prudens/shared/types';

interface Props {
  metrics: AdminMetricsDto;
}

export function MetricsPanel({ metrics }: Props) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Empresas cadastradas</p>
          <p className="text-2xl font-semibold">{metrics.totalCompanies}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Produtos (importação ativa)</p>
          <p className="text-2xl font-semibold">{metrics.totalProducts}</p>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">IDD médio por empresa</p>
        {metrics.avgIddByCompany.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma empresa com dados ativos.</p>
        ) : (
          <ul className="max-h-48 divide-y overflow-y-auto text-sm">
            {metrics.avgIddByCompany.map((row) => (
              <li key={row.companyId} className="flex justify-between py-2">
                <span>{row.companyName}</span>
                <span className="font-medium tabular-nums">
                  {row.avgIdd != null ? row.avgIdd.toFixed(2) : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
