import { AuthSignOutButton } from '@/components/AuthSignOutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <h1 className="text-xl font-semibold">Prudens Index — Admin</h1>
        <AuthSignOutButton variant="compact" />
      </header>
      {children}
    </div>
  );
}
