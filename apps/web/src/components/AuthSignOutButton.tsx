'use client';

import { SignOutButton } from '@clerk/nextjs';

export function AuthSignOutButton() {
  return (
    <SignOutButton redirectUrl="/sign-in">
      <button
        type="button"
        className="w-full rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        Sair da conta
      </button>
    </SignOutButton>
  );
}
