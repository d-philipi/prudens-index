'use client';

import { useAuth, useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  homePathForRole,
  parseRoleFromSessionClaims,
} from '@/lib/clerkRoles';
import { getProfileAccentColor, type LoginProfile } from '@/lib/auth-theme';
import { cn } from '@/lib/utils';
import { strings } from '@/lib/strings';

interface Props {
  profile: LoginProfile;
  onProfileChange: (profile: LoginProfile) => void;
}

export function LoginForm({ profile, onProfileChange }: Props) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn, sessionClaims } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    const role = parseRoleFromSessionClaims(
      sessionClaims as Record<string, unknown> | null | undefined,
    );
    if (!role) {
      router.replace('/acesso-pendente');
      return;
    }
    if (role !== profile) {
      setError(
        role === 'admin' ? strings.auth.mismatchUseAdmin : strings.auth.mismatchUseClient,
      );
      return;
    }
    router.replace(homePathForRole(role));
  }, [isSignedIn, sessionClaims, profile, router]);

  const accent = getProfileAccentColor(profile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        return;
      }

      if (
        result.status === 'needs_second_factor' ||
        result.status === 'needs_first_factor'
      ) {
        router.push('/verify');
        return;
      }

      setError('Não foi possível concluir o login. Tente novamente.');
    } catch (err) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      const msg =
        clerkErr.errors?.[0]?.longMessage ??
        clerkErr.errors?.[0]?.message ??
        'E-mail ou senha inválidos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-medium text-brand">{strings.auth.signInTitle}</h2>
        <p className="mt-1 text-sm text-text-subtitle">{strings.auth.signInSubtitle}</p>
      </div>

      <div role="group" aria-label={strings.auth.profileGroupLabel}>
        <span className="mb-2 block text-sm font-medium text-brand">
          {strings.auth.profileGroupLabel}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onProfileChange('client');
              setError(null);
            }}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-300',
              profile === 'client'
                ? 'border-brand-accent text-brand'
                : 'border-border-default text-text-subtitle hover:border-brand/40 hover:text-brand',
            )}
            style={
              profile === 'client'
                ? {
                    borderColor: '#d4a020',
                    backgroundColor: 'rgba(212, 160, 32, 0.1)',
                  }
                : undefined
            }
            aria-pressed={profile === 'client'}
          >
            {strings.auth.profileClient}
          </button>
          <button
            type="button"
            onClick={() => {
              onProfileChange('admin');
              setError(null);
            }}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-300',
              profile === 'admin'
                ? 'border-brand text-brand'
                : 'border-border-default text-text-subtitle hover:border-brand/40 hover:text-brand',
            )}
            style={
              profile === 'admin'
                ? {
                    borderColor: '#1a4731',
                    backgroundColor: 'rgba(26, 71, 49, 0.08)',
                  }
                : undefined
            }
            aria-pressed={profile === 'admin'}
          >
            {strings.auth.profileAdmin}
          </button>
        </div>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-brand">E-mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border-default px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-brand">Senha</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border-default px-3 py-2 text-sm"
        />
      </label>

      {error ? (
        <p className="rounded border border-status-distribution/30 bg-red-50 p-3 text-sm text-status-distribution">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !isLoaded}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: accent }}
      >
        {loading ? strings.common.loading : 'Entrar'}
      </button>
    </form>
  );
}
