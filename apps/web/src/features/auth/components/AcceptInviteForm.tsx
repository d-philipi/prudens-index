'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { homePathForRole, parseRoleFromSessionClaims } from '@/lib/clerkRoles';
import { strings } from '@/lib/strings';

export function AcceptInviteForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketReady, setTicketReady] = useState(false);

  const ticket =
    searchParams.get('__clerk_ticket') ??
    searchParams.get('ticket') ??
    '';

  useEffect(() => {
    if (!isLoaded || !signUp || !ticket) return;
    let cancelled = false;
    (async () => {
      try {
        await signUp.create({ strategy: 'ticket', ticket });
        if (!cancelled) setTicketReady(true);
      } catch {
        if (!cancelled) {
          setError(strings.auth.inviteInvalid);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, signUp, ticket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (password !== confirm) {
      setError(strings.auth.passwordMismatch);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signUp.update({ password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.refresh();
        const role = parseRoleFromSessionClaims(
          signUp as unknown as Record<string, unknown>,
        );
        if (role) {
          router.replace(homePathForRole(role));
        } else {
          router.replace('/acesso-pendente');
        }
        return;
      }
      setError('Não foi possível definir a senha. Tente novamente.');
    } catch {
      setError(strings.auth.inviteInvalid);
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) {
    return (
      <p className="text-sm text-status-distribution">{strings.auth.inviteInvalid}</p>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-medium text-brand">
          {strings.auth.inviteTitle}
        </h2>
        <p className="mt-1 text-sm text-text-subtitle">{strings.auth.inviteSubtitle}</p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-brand">{strings.auth.newPassword}</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          disabled={!ticketReady}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border-default px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-brand">{strings.auth.confirmPassword}</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          disabled={!ticketReady}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
        disabled={loading || !isLoaded || !ticketReady}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? strings.common.loading : strings.auth.inviteSubmit}
      </button>
    </form>
  );
}
