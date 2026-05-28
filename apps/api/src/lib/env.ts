export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** Origins allowed for browser calls from the Next.js app (localhost variants included). */
export function getCorsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  if (raw === '*') return true;
  return [
    ...new Set([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...raw.split(',').map((s) => s.trim()).filter(Boolean),
    ]),
  ];
}

/**
 * Full URL where invitees land after clicking the Clerk invite link.
 * MUST include the `/sign-up` path. Do not append `/sign-up` again in callers.
 */
export function getClerkInviteRedirectUrl(): string {
  const explicit = process.env.CLERK_INVITE_REDIRECT_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${appUrl}/sign-up`;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://prudens:prudens@localhost:5432/prudens_index',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? '',
  clerkInviteRedirectUrl: getClerkInviteRedirectUrl(),
  r2Endpoint: process.env.R2_ENDPOINT ?? '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  r2Bucket: process.env.R2_BUCKET ?? 'prudens-uploads',
};
