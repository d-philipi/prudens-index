export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-xl font-semibold">Prudens Index — Dashboard</h1>
      </header>
      {children}
    </div>
  );
}
