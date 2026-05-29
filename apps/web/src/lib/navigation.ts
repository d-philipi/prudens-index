import type { AppRole } from '@/lib/clerkRoles';
import {
  Building2,
  Download,
  LayoutDashboard,
  Package,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavItemId = 'dashboard' | 'produtos' | 'exportacao' | 'companies' | 'users' | 'imports';

export interface NavItemConfig {
  id: NavItemId;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: AppRole[];
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['client'],
  },
  {
    id: 'produtos',
    label: 'Produtos',
    href: '/produtos',
    icon: Package,
    roles: ['client'],
  },
  {
    id: 'exportacao',
    label: 'Exportação',
    href: '/exportacao',
    icon: Download,
    roles: ['client'],
  },
  {
    id: 'companies',
    label: 'Empresas',
    href: '/admin',
    icon: Building2,
    roles: ['admin'],
  },
  {
    id: 'users',
    label: 'Usuários',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['admin'],
  },
  {
    id: 'imports',
    label: 'Importações',
    href: '/admin/imports',
    icon: Download,
    roles: ['admin'],
  },
];

export function navItemsForRole(role: AppRole): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function isNavActive(pathname: string, item: NavItemConfig): boolean {
  if (item.id === 'companies') {
    return pathname === '/admin' || pathname.startsWith('/admin/companies');
  }
  if (item.href === '/admin/imports') {
    return pathname === '/admin/imports' || pathname.includes('/imports');
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
