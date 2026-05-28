'use client';

import Link from 'next/link';
import type { NavItemConfig } from '@/lib/navigation';

interface Props {
  item: NavItemConfig;
  active: boolean;
  collapsed: boolean;
}

export function SidebarNavItem({ item, active, collapsed }: Props) {
  const Icon = item.icon;
  const base =
    'flex items-center gap-3 rounded-r-none py-2.5 text-sm transition-colors duration-200';
  const activeCls = active
    ? 'border-l-[3px] border-brand-accent bg-white/10 text-white'
    : 'border-l-[3px] border-transparent text-white/65 hover:text-white/85';
  const widthCls = collapsed ? 'justify-center px-0' : 'px-4';

  return (
    <Link
      href={item.href}
      className={`${base} ${activeCls} ${widthCls}`}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
    </Link>
  );
}
