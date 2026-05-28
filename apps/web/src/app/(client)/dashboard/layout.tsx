import { AuthSignOutButton } from '@/components/AuthSignOutButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 md:px-4 md:py-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <h1 className="text-lg font-semibold text-slate-900">Prudens Index</h1>
        <AuthSignOutButton variant="compact" />
      </header>
      {children}
    </div>
  );
}
