/**
 * Cloudflare R2 S3 API endpoint (presigned PUT/GET).
 * Example: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *
 * Do NOT use the public bucket URL (*.r2.dev) here — that is for read-only CDN access.
 */
export function resolveR2S3Endpoint(raw: string | undefined): string | undefined {
  const endpoint = raw?.trim();
  if (!endpoint) return undefined;

  if (endpoint.includes('.r2.dev') && !endpoint.includes('r2.cloudflarestorage.com')) {
    throw new Error(
      'R2_ENDPOINT inválido: use a URL S3 da API (https://<ACCOUNT_ID>.r2.cloudflarestorage.com), ' +
        'não a URL pública do bucket (*.r2.dev). Veja apps/api/.env.example',
    );
  }

  return endpoint.replace(/\/$/, '');
}
