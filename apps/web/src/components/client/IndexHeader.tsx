import type { ClientOverviewDto } from '@prudens/shared/types';
import { iddHeroColor } from '@/lib/idd-display';

interface Props {
  overview: ClientOverviewDto;
}

export function IndexHeader({ overview }: Props) {
  const updated = overview.lastUpdatedAt
    ? new Date(overview.lastUpdatedAt).toLocaleString('pt-BR')
    : null;
  const idd = overview.avgIdd;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border-default bg-brand p-6 text-white">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-white/60">
          IDD médio da empresa
        </p>
        <p
          className="mt-1 font-mono text-[32px] font-bold tabular-nums leading-none"
          style={{ color: iddHeroColor(idd) }}
        >
          {idd != null ? `${idd.toFixed(2)}%` : '—'}
        </p>
      </div>
      <div className="text-right text-sm">
        <p className="font-medium">{overview.companyName}</p>
        <p className="mt-1 text-xs text-white/70">
          Última atualização: {updated ?? 'Sem importação concluída'}
        </p>
      </div>
    </header>
  );
}
