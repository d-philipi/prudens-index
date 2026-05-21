export function resolveR2S3Endpoint(raw: string | undefined): string | undefined {
  const endpoint = raw?.trim();
  if (!endpoint) return undefined;

  if (endpoint.includes('.r2.dev') && !endpoint.includes('r2.cloudflarestorage.com')) {
    throw new Error(
      'R2_ENDPOINT inválido: use https://<ACCOUNT_ID>.r2.cloudflarestorage.com (não *.r2.dev)',
    );
  }

  return endpoint.replace(/\/$/, '');
}
