import Link from 'next/link';
import { AuthSignOutButton } from '@/components/AuthSignOutButton';
import { strings } from '@/lib/strings';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin" className="text-xl font-semibold hover:underline">
            Prudens Index — Admin
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-slate-600 underline-offset-2 hover:underline">
              {strings.admin.companies}
            </Link>
            <Link href="/admin/usuarios" className="text-slate-600 underline-offset-2 hover:underline">
              {strings.admin.users}
            </Link>
            <Link href="/admin/imports" className="text-slate-600 underline-offset-2 hover:underline">
              {strings.admin.imports}
            </Link>
          </nav>
        </div>
        <AuthSignOutButton variant="compact" />
      </header>
      {children}
    </div>
  );
}
