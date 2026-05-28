'use client';

import { SignOutButton } from '@clerk/nextjs';
import { strings } from '@/lib/strings';

interface Props {
  /** Estilo compacto para barras de topo (admin / dashboard). */
  variant?: 'default' | 'compact';
  className?: string;
}

export function AuthSignOutButton({ variant = 'default', className }: Props) {
  const base =
    variant === 'compact'
      ? 'rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50'
      : 'w-full rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

  return (
    <SignOutButton redirectUrl="/sign-in">
      <button type="button" className={className ? `${base} ${className}` : base}>
        {strings.common.signOut}
      </button>
    </SignOutButton>
  );
}
