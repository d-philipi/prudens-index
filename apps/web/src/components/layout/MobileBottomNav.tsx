'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AppRole } from '@/lib/clerkRoles';
import { navItemsForRole, isNavActive } from '@/lib/navigation';

interface Props {
  role: AppRole;
}

export function MobileBottomNav({ role }: Props) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border-default bg-brand xl:hidden"
      aria-label="Navegação mobile"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
              active ? 'text-white' : 'text-white/65'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="truncate px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
