/** Set by LoginForm after prepare*; VerifyForm skips auto-send when present. */
export const CLERK_VERIFY_CODE_SENT_KEY = 'clerkVerifyCodeSent';

export type SignInVerificationMode = 'first' | 'second';

type SignInStatus =
  | 'complete'
  | 'needs_first_factor'
  | 'needs_second_factor'
  | 'needs_client_trust'
  | string;

type EmailCodeFactor = {
  strategy: 'email_code';
  emailAddressId: string;
};

type SignInFactor = { strategy: string; emailAddressId?: string };

export type SignInAttemptResult = {
  status: string | null;
  createdSessionId: string | null;
};

/** Minimal Clerk SignIn surface used by login/verify helpers. */
export type SignInLike = {
  status: string | null;
  supportedFirstFactors: SignInFactor[] | null;
  supportedSecondFactors: SignInFactor[] | null;
  prepareFirstFactor: (params: {
    strategy: 'email_code';
    emailAddressId: string;
  }) => Promise<unknown>;
  prepareSecondFactor: (params: {
    strategy: 'email_code';
    emailAddressId: string;
  }) => Promise<unknown>;
  attemptFirstFactor: (params: {
    strategy: 'email_code';
    code: string;
  }) => Promise<unknown>;
  attemptSecondFactor: (params: {
    strategy: 'email_code';
    code: string;
  }) => Promise<unknown>;
};

function isEmailCodeFactor(factor: { strategy: string }): factor is EmailCodeFactor {
  return (
    factor.strategy === 'email_code' &&
    'emailAddressId' in factor &&
    typeof (factor as EmailCodeFactor).emailAddressId === 'string'
  );
}

export function getPendingVerificationMode(status: SignInStatus | null): SignInVerificationMode | null {
  if (!status) return null;
  switch (status) {
    case 'needs_first_factor':
      return 'first';
    case 'needs_second_factor':
    case 'needs_client_trust':
      return 'second';
    default:
      return null;
  }
}

export function isSignInAwaitingVerification(signIn: SignInLike): boolean {
  return getPendingVerificationMode(signIn.status ?? null) !== null;
}

export function findEmailCodeFactor(
  signIn: SignInLike,
  mode: SignInVerificationMode,
): EmailCodeFactor | null {
  const factors =
    mode === 'first' ? signIn.supportedFirstFactors : signIn.supportedSecondFactors;
  if (!factors?.length) return null;
  const match = factors.find(isEmailCodeFactor);
  return match ?? null;
}

export async function sendEmailVerificationCode(
  signIn: SignInLike,
  mode: SignInVerificationMode,
): Promise<void> {
  const factor = findEmailCodeFactor(signIn, mode);
  if (!factor) {
    throw new Error('EMAIL_CODE_FACTOR_NOT_FOUND');
  }

  if (mode === 'first') {
    await signIn.prepareFirstFactor({
      strategy: 'email_code',
      emailAddressId: factor.emailAddressId,
    });
    return;
  }

  await signIn.prepareSecondFactor({
    strategy: 'email_code',
    emailAddressId: factor.emailAddressId,
  });
}

export async function attemptEmailVerificationCode(
  signIn: SignInLike,
  mode: SignInVerificationMode,
  code: string,
): Promise<SignInAttemptResult> {
  const raw =
    mode === 'first'
      ? await signIn.attemptFirstFactor({ strategy: 'email_code', code })
      : await signIn.attemptSecondFactor({ strategy: 'email_code', code });

  const result = raw as SignInAttemptResult;
  return {
    status: result.status ?? null,
    createdSessionId: result.createdSessionId ?? null,
  };
}

export function formatClerkError(err: unknown, fallback: string): string {
  const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> };
  return (
    clerkErr.errors?.[0]?.longMessage ?? clerkErr.errors?.[0]?.message ?? fallback
  );
}
