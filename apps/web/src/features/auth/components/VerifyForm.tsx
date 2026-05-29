'use client';

import { useSignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  attemptEmailVerificationCode,
  CLERK_VERIFY_CODE_SENT_KEY,
  findEmailCodeFactor,
  formatClerkError,
  getPendingVerificationMode,
  isSignInAwaitingVerification,
  sendEmailVerificationCode,
  type SignInVerificationMode,
} from '@/lib/clerkSignIn';
import { strings } from '@/lib/strings';

export function VerifyForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [mode, setMode] = useState<SignInVerificationMode | null>(null);
  const edgeCasePrepareDone = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!signIn) {
      router.replace('/login');
      return;
    }
    if (!isSignInAwaitingVerification(signIn)) {
      sessionStorage.removeItem(CLERK_VERIFY_CODE_SENT_KEY);
      router.replace('/login');
      return;
    }

    const pendingMode = getPendingVerificationMode(signIn.status);
    if (!pendingMode) {
      sessionStorage.removeItem(CLERK_VERIFY_CODE_SENT_KEY);
      router.replace('/login');
      return;
    }
    setMode(pendingMode);

    if (edgeCasePrepareDone.current) return;
    if (sessionStorage.getItem(CLERK_VERIFY_CODE_SENT_KEY)) return;
    if (!findEmailCodeFactor(signIn, pendingMode)) return;

    edgeCasePrepareDone.current = true;
    void (async () => {
      try {
        await sendEmailVerificationCode(signIn, pendingMode);
        sessionStorage.setItem(CLERK_VERIFY_CODE_SENT_KEY, '1');
      } catch {
        edgeCasePrepareDone.current = false;
      }
    })();
  }, [isLoaded, signIn, router]);

  const handleResend = async () => {
    if (!isLoaded || !signIn || !mode) return;
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      if (!findEmailCodeFactor(signIn, mode)) {
        setError(strings.auth.verifyUnsupportedFactor);
        return;
      }
      await sendEmailVerificationCode(signIn, mode);
      setInfo(strings.auth.verifyResendSuccess);
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_CODE_FACTOR_NOT_FOUND') {
        setError(strings.auth.verifyUnsupportedFactor);
        return;
      }
      setError(formatClerkError(err, strings.auth.verifyInvalidCode));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || !mode) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const result = await attemptEmailVerificationCode(signIn, mode, code.trim());

      if (result.status === 'complete') {
        sessionStorage.removeItem(CLERK_VERIFY_CODE_SENT_KEY);
        await setActive({ session: result.createdSessionId });
        router.refresh();
        router.replace('/');
        return;
      }

      setError(strings.auth.verifyInvalidCode);
    } catch (err) {
      setError(formatClerkError(err, strings.auth.verifyInvalidCode));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !mode) {
    return <p className="text-sm text-text-subtitle">{strings.common.loading}</p>;
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-medium text-brand">
          {strings.auth.verifyTitle}
        </h2>
        <p className="mt-1 text-sm text-text-subtitle">{strings.auth.verifySubtitle}</p>
        <p className="mt-1 text-xs text-text-subtitle">{strings.auth.verifySpamHint}</p>
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

      {info ? (
        <p className="rounded border border-brand/20 bg-brand/5 p-3 text-sm text-brand">
          {info}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || resending || !isLoaded}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? strings.common.loading : strings.auth.verifySubmit}
      </button>

      <button
        type="button"
        disabled={loading || resending || !isLoaded}
        onClick={() => void handleResend()}
        className="w-full rounded-lg border border-border-default px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:border-brand/40 disabled:opacity-60"
      >
        {resending ? strings.common.loading : strings.auth.verifyResend}
      </button>

      <Link
        href="/login"
        className="block text-center text-sm text-text-subtitle underline-offset-2 hover:underline"
      >
        {strings.auth.verifyBackToLogin}
      </Link>
    </form>
  );
}
