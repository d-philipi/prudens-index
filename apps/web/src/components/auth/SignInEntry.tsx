'use client';

import { SignIn, SignOutButton, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AppRole } from '@/lib/clerkRoles';
import { homePathForRole, parseRoleFromSessionClaims } from '@/lib/clerkRoles';
import { authAppearance } from '@/lib/clerk-appearance';
import { strings } from '@/lib/strings';
import { EntryProfileSelector } from './EntryProfileSelector';

const PROFILE_KEY = 'prudens.auth.selectedProfile';

export function SignInEntry() {
  const [selected, setSelected] = useState<AppRole>('client');
  const [mismatch, setMismatch] = useState<string | null>(null);
  const { isSignedIn, sessionClaims } = useAuth();
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PROFILE_KEY);
      if (stored === 'admin' || stored === 'client') setSelected(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const handleSelect = (role: AppRole) => {
    setSelected(role);
    setMismatch(null);
    try {
      sessionStorage.setItem(PROFILE_KEY, role);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!isSignedIn) return;
    const role = parseRoleFromSessionClaims(sessionClaims as Record<string, unknown> | null);
    if (!role) {
      router.replace('/acesso-pendente');
      return;
    }
    if (role !== selected) {
      setMismatch(
        role === 'admin' ? strings.auth.mismatchUseAdmin : strings.auth.mismatchUseClient,
      );
      return;
    }
    router.replace(homePathForRole(role));
  }, [isSignedIn, sessionClaims, selected, router]);

  return (
    <div>
      <h2 className="mb-1 font-display text-lg font-medium text-brand">{strings.auth.signInTitle}</h2>
      <p className="mb-4 text-sm text-text-subtitle">{strings.auth.signInSubtitle}</p>
      <EntryProfileSelector value={selected} onChange={handleSelect} />
      {mismatch ? (
        <div className="mb-4 rounded border border-status-distribution/30 bg-red-50 p-3 text-sm text-status-distribution">
          <p>{mismatch}</p>
          <SignOutButton redirectUrl="/sign-in">
            <button type="button" className="mt-2 text-sm font-medium underline">
              {strings.common.signOut}
            </button>
          </SignOutButton>
        </div>
      ) : null}
      {!isSignedIn || mismatch ? (
        <SignIn routing="path" path="/sign-in" appearance={authAppearance} />
      ) : null}
    </div>
  );
}
