import Link from 'next/link';
import type { AdminCompanyCardDto } from '@prudens/shared/types';
import { iddTableColor } from '@/lib/idd-display';

interface Props {
  company: AdminCompanyCardDto;
}

export function CompanyCard({ company }: Props) {
  return (
    <Link
      href={`/admin/companies/${company.id}`}
      className="block rounded-lg border border-border-default bg-surface-card p-4 transition hover:border-brand"
    >
      <h2 className="font-semibold text-brand">{company.name}</h2>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-text-subtitle">
        <div>
          <dt className="text-xs uppercase text-text-subtitle">IDD médio</dt>
          <dd
            className="font-mono font-medium tabular-nums"
            style={{ color: iddTableColor(company.avgIdd) }}
          >
            {company.avgIdd != null ? company.avgIdd.toFixed(2) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-text-subtitle">Produtos</dt>
          <dd className="font-medium text-brand">{company.productCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase text-text-subtitle">Cadastro</dt>
          <dd>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>
    </Link>
  );
}
