import type { AdminMetricsDto } from '@prudens/shared/types';
import { iddTableColor } from '@/lib/idd-display';

interface Props {
  metrics: AdminMetricsDto;
}

const cardClass =
  'rounded-lg border border-border-default bg-surface-page p-4';

export function MetricsPanel({ metrics }: Props) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cardClass}>
          <p className="text-sm text-text-subtitle">Empresas cadastradas</p>
          <p className="text-2xl font-semibold text-brand">{metrics.totalCompanies}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-text-subtitle">Produtos (importação ativa)</p>
          <p className="text-2xl font-semibold text-brand">{metrics.totalProducts}</p>
        </div>
      </div>
      <div className={cardClass}>
        <p className="mb-3 text-sm font-medium text-brand">IDD médio por empresa</p>
        {metrics.avgIddByCompany.length === 0 ? (
          <p className="text-sm text-text-subtitle">Nenhuma empresa com dados ativos.</p>
        ) : (
          <ul className="max-h-48 divide-y divide-border-default overflow-y-auto text-sm">
            {metrics.avgIddByCompany.map((row) => (
              <li key={row.companyId} className="flex justify-between py-2">
                <span>{row.companyName}</span>
                <span
                  className="font-mono font-medium tabular-nums"
                  style={{ color: iddTableColor(row.avgIdd) }}
                >
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
