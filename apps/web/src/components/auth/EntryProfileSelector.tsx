'use client';

import type { AppRole } from '@/lib/clerkRoles';
import { strings } from '@/lib/strings';

interface Props {
  value: AppRole;
  onChange: (role: AppRole) => void;
}

export function EntryProfileSelector({ value, onChange }: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3" role="group" aria-label={strings.auth.profileGroupLabel}>
      <button
        type="button"
        onClick={() => onChange('admin')}
        className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
          value === 'admin'
            ? 'border-brand bg-brand text-white'
            : 'border-border-default bg-surface-page text-brand hover:border-brand/40'
        }`}
        aria-pressed={value === 'admin'}
      >
        {strings.auth.profileAdmin}
      </button>
      <button
        type="button"
        onClick={() => onChange('client')}
        className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
          value === 'client'
            ? 'border-brand-accent bg-brand-accent text-brand'
            : 'border-border-default bg-surface-page text-brand hover:border-brand-accent/60'
        }`}
        aria-pressed={value === 'client'}
      >
        {strings.auth.profileClient}
      </button>
    </div>
  );
}
