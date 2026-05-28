import Link from 'next/link';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { CreateCompanyForm } from '@/features/admin/components/CreateCompanyForm';
import { strings } from '@/lib/strings';

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: strings.admin.companies, href: '/admin' },
          { label: strings.admin.newCompanyBreadcrumb },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">{strings.admin.newCompanyTitle}</h1>
        <Link href="/admin" className="text-sm text-text-subtitle underline">
          {strings.admin.backToCompanies}
        </Link>
      </div>
      <CreateCompanyForm />
    </div>
  );
}
