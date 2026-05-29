'use client';

import type { ClientDashboardSummaryDto, ProductHighlightDto } from '@prudens/shared/types';
import { formatCurrency, formatPercent, formatStockDays } from '@prudens/shared/formatters';
import { STATUS_CONFIG } from '@prudens/shared/status-config';
import { strings } from '@/lib/strings';

interface Props {
  summary: ClientDashboardSummaryDto;
}

function HighlightRow({
  label,
  highlight,
  formatValue,
}: {
  label: string;
  highlight: ProductHighlightDto | null;
  formatValue: (v: number) => string;
}) {
  if (!highlight) return null;
  return (
    <p className="text-xs text-text-subtitle">
      <span className="font-medium text-brand">{label}:</span>{' '}
      {highlight.productName} ({formatValue(highlight.value)})
    </p>
  );
}

export function ExecutiveSummary({ summary }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-brand">{strings.client.executiveSummaryTitle}</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border-[0.5px] border-border-default bg-surface-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-subtitle">
            {strings.client.projectedRevenue}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-brand">
            {formatCurrency(summary.totalProjectedRevenue)}
          </p>
        </div>
        <div className="rounded-lg border-[0.5px] border-border-default bg-surface-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-subtitle">
            {strings.client.tiedUpCapital}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-brand">
            {formatCurrency(summary.totalTiedUpCapital)}
          </p>
        </div>
        <div className="rounded-lg border-[0.5px] border-border-default bg-surface-card p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-subtitle">
            {strings.client.lostRevenue}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-brand">
            {formatCurrency(summary.totalLostRevenue)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border-[0.5px] border-border-default bg-surface-card p-4">
          <p className="text-xs font-medium text-brand">{strings.client.statusCountsTitle}</p>
          <ul className="mt-2 space-y-1">
            {summary.statusCounts.map(({ status, count }) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: STATUS_CONFIG[status].color }}
                    aria-hidden
                  />
                  {STATUS_CONFIG[status].label}
                </span>
                <span className="font-mono tabular-nums text-brand">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border-[0.5px] border-border-default bg-surface-card p-4">
          <p className="text-xs font-medium text-brand">{strings.client.topRiskTitle}</p>
          {summary.topRiskProducts.length === 0 ? (
            <p className="mt-2 text-xs text-text-subtitle">{strings.client.noRiskProducts}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {summary.topRiskProducts.map((r) => (
                <li key={r.productName} className="text-sm">
                  <p className="font-medium text-brand">{r.productName}</p>
                  <p className="text-xs text-text-subtitle">
                    {formatCurrency(r.riskScore)} — {strings.client.riskScoreHint}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border-[0.5px] border-border-default bg-surface-card p-4">
        <p className="text-xs font-medium text-brand">{strings.client.extremesTitle}</p>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          <HighlightRow
            label={strings.client.minStockDaysLabel}
            highlight={summary.minStockDays}
            formatValue={(v) => formatStockDays(v)}
          />
          <HighlightRow
            label={strings.client.maxStockDaysLabel}
            highlight={summary.maxStockDays}
            formatValue={(v) => formatStockDays(v)}
          />
          <HighlightRow
            label={strings.client.minIddLabel}
            highlight={summary.minIdd}
            formatValue={(v) => formatPercent(v, { decimals: 0 })}
          />
          <HighlightRow
            label={strings.client.maxIddLabel}
            highlight={summary.maxIdd}
            formatValue={(v) => formatPercent(v, { decimals: 0 })}
          />
          <HighlightRow
            label={strings.client.minProjectedRevenueLabel}
            highlight={summary.minProjectedRevenue}
            formatValue={(v) => formatCurrency(v)}
          />
          <HighlightRow
            label={strings.client.maxProjectedRevenueLabel}
            highlight={summary.maxProjectedRevenue}
            formatValue={(v) => formatCurrency(v)}
          />
          <HighlightRow
            label={strings.client.maxTiedUpCapitalLabel}
            highlight={summary.maxTiedUpCapital}
            formatValue={(v) => formatCurrency(v)}
          />
          <HighlightRow
            label={strings.client.maxLostRevenueLabel}
            highlight={summary.maxLostRevenue}
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
      </div>
    </section>
  );
}
