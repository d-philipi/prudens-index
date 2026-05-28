import type { ClientOverviewDto } from '@prudens/shared/types';

interface Props {
  overview: ClientOverviewDto;
}

export function IndexHeader({ overview }: Props) {
  const updated = overview.lastUpdatedAt
    ? new Date(overview.lastUpdatedAt).toLocaleString('pt-BR')
    : null;

  return (
    <header className="rounded-lg border bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-sm">
      <p className="text-sm text-slate-300">{overview.companyName}</p>
      <p className="mt-1 text-xs text-slate-400">
        Última atualização: {updated ?? 'Sem importação concluída'}
      </p>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">IDD médio da empresa</p>
        <p className="text-4xl font-bold tabular-nums">
          {overview.avgIdd != null ? overview.avgIdd.toFixed(2) : '—'}
        </p>
      </div>
    </header>
  );
}
