'use client';

import type { AppRole } from '@/lib/clerkRoles';
import { AppShell } from './AppShell';

interface Props {
  role: AppRole;
  children: React.ReactNode;
}

export function AppShellWrapper({ role, children }: Props) {
  return <AppShell role={role}>{children}</AppShell>;
}
