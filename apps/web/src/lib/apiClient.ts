const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token: string },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${options.token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error(
      `Não foi possível conectar à API (${API_URL}). Confirme que \`pnpm --filter @prudens/api dev\` está rodando e que a web usa a mesma origem permitida em CORS_ORIGIN (ex.: http://localhost:3000).`,
    );
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Erro na API (${res.status})`);
  }
  if (res.headers.get('content-type')?.includes('application/pdf')) {
    return res.blob() as Promise<T>;
  }
  return res.json() as Promise<T>;
}
