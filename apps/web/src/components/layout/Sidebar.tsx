'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { AppRole } from '@/lib/clerkRoles';
import { navItemsForRole, isNavActive } from '@/lib/navigation';
import { AuthSignOutButton } from '@/components/AuthSignOutButton';
import { Logo } from './Logo';
import { SidebarNavItem } from './SidebarNavItem';

interface Props {
  role: AppRole;
  collapsed: boolean;
  hydrated: boolean;
  onToggle: () => void;
}

export function Sidebar({ role, collapsed, hydrated, onToggle }: Props) {
  const pathname = usePathname();
  const items = navItemsForRole(role);
  const isCollapsed = hydrated && collapsed;
  const width = isCollapsed ? 64 : 220;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden bg-brand transition-[width] duration-200 xl:flex"
      style={{ width }}
      aria-label="Barra lateral"
    >
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-white/10 px-2">
        <Logo variant="onDark" collapsed={isCollapsed} className="mx-auto" />
      </div>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-2"
        aria-label="Navegação principal"
      >
        {items.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={isNavActive(pathname, item)}
            collapsed={isCollapsed}
          />
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-2">
        <div className={`mb-2 ${isCollapsed ? 'flex justify-center' : 'px-2'}`}>
          <AuthSignOutButton variant="sidebar" collapsed={isCollapsed} />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center gap-2 rounded py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white ${
            isCollapsed ? 'justify-center' : 'px-4'
          }`}
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
