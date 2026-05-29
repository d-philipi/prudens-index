'use client';

import { Logo } from '@/components/layout/Logo';

interface Props {
  children: React.ReactNode;
}

export function AuthCard({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page p-4">
      <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-card p-6">
        <div className="mb-6 flex justify-center">
          <Logo variant="onLight" />
        </div>
        {children}
      </div>
    </div>
  );
}
