'use client';

import { SignOutButton } from '@clerk/nextjs';
import { strings } from '@/lib/strings';

interface Props {
  variant?: 'default' | 'compact' | 'sidebar';
  collapsed?: boolean;
  className?: string;
}

export function AuthSignOutButton({
  variant = 'default',
  collapsed = false,
  className,
}: Props) {
  const base =
    variant === 'compact'
      ? 'rounded border border-border-default bg-surface-card px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-surface-page'
      : variant === 'sidebar'
        ? collapsed
          ? 'rounded p-2 text-white/80 hover:bg-white/10 hover:text-white'
          : 'w-full rounded border border-white/20 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10'
        : 'w-full rounded border border-border-default bg-surface-card px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-surface-page focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

  return (
    <SignOutButton redirectUrl="/sign-in">
      <button
        type="button"
        className={className ? `${base} ${className}` : base}
        title={variant === 'sidebar' && collapsed ? strings.common.signOut : undefined}
      >
        {variant === 'sidebar' && collapsed ? '⎋' : strings.common.signOut}
      </button>
    </SignOutButton>
  );
}
