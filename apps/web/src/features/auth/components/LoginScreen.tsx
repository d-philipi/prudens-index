'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import type { LoginProfile } from '@/lib/auth-theme';
import { AuthDecorations } from './AuthDecorations';
import { LoginForm } from './LoginForm';

const PROFILE_KEY = 'prudens.auth.selectedProfile';

export function LoginScreen() {
  const [profile, setProfile] = useState<LoginProfile>('client');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PROFILE_KEY);
      if (stored === 'admin' || stored === 'client') setProfile(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const handleProfileChange = (next: LoginProfile) => {
    setProfile(next);
    try {
      sessionStorage.setItem(PROFILE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-page">
      <AuthDecorations profile={profile} />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-card p-6 shadow-none">
          <div className="mb-6 flex justify-center">
            <Logo variant="onLight" />
          </div>
          <LoginForm profile={profile} onProfileChange={handleProfileChange} />
        </div>
      </div>
    </div>
  );
}
