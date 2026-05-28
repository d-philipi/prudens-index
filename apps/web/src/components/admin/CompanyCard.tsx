import Link from 'next/link';
import type { AdminCompanyCardDto } from '@prudens/shared/types';

interface Props {
  company: AdminCompanyCardDto;
}

export function CompanyCard({ company }: Props) {
  return (
    <Link
      href={`/admin/companies/${company.id}`}
      className="block rounded-lg border bg-white p-4 shadow-sm transition hover:border-slate-400"
    >
      <h2 className="font-semibold">{company.name}</h2>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600">
        <div>
          <dt className="text-xs uppercase text-slate-400">IDD médio</dt>
          <dd className="font-medium tabular-nums">
            {company.avgIdd != null ? company.avgIdd.toFixed(2) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-400">Produtos</dt>
          <dd className="font-medium">{company.productCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase text-slate-400">Cadastro</dt>
          <dd>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>
    </Link>
  );
}
