'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { homePathForRole, parseRoleFromSessionClaims } from '@/lib/clerkRoles';
import { strings } from '@/lib/strings';

export function VerifyForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.refresh();
        const role = parseRoleFromSessionClaims(
          result as unknown as Record<string, unknown>,
        );
        if (role) {
          router.replace(homePathForRole(role));
        } else {
          router.replace('/acesso-pendente');
        }
        return;
      }

      setError('Código inválido ou expirado. Tente novamente.');
    } catch {
      setError('Código inválido ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-medium text-brand">
          {strings.auth.verifyTitle}
        </h2>
        <p className="mt-1 text-sm text-text-subtitle">{strings.auth.verifySubtitle}</p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-brand">{strings.auth.verifyCodeLabel}</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
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
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? strings.common.loading : strings.auth.verifySubmit}
      </button>
    </form>
  );
}
