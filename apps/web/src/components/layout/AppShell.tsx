'use client';

import { usePathname } from 'next/navigation';
import type { AppRole } from '@/lib/clerkRoles';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { resolvePageMeta } from '@/lib/page-meta';
import { PageHeader } from './PageHeader';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

interface Props {
  role: AppRole;
  children: React.ReactNode;
}

export function AppShell({ role, children }: Props) {
  const pathname = usePathname();
  const meta = resolvePageMeta(pathname);
  const { collapsed, toggle, hydrated } = useSidebarCollapsed();
  const sidebarWidth = !hydrated ? 220 : collapsed ? 64 : 220;

  return (
    <div
      className="min-h-screen bg-surface-page"
      style={{ ['--sidebar-w' as string]: `${sidebarWidth}px` }}
    >
      <Sidebar
        role={role}
        collapsed={collapsed}
        hydrated={hydrated}
        onToggle={toggle}
      />
      <div className="min-h-screen pb-16 transition-[margin-left] duration-200 xl:ml-[var(--sidebar-w)] xl:pb-0">
        <main className="mx-auto w-full max-w-[1280px] overflow-x-hidden p-4 md:p-6">
          <PageHeader title={meta.title} subtitle={meta.subtitle} />
          {children}
        </main>
      </div>
      <MobileBottomNav role={role} />
    </div>
  );
}
