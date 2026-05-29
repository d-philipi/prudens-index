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

/** Baixa a planilha ativa (302 redirect ou JSON com URL assinada). */
export async function downloadActiveSpreadsheet(token: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/client/export/active-file?format=json`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'manual',
    });
  } catch {
    throw new Error(
      `Não foi possível conectar à API (${API_URL}). Confirme que a API está em execução.`,
    );
  }

  if (res.status === 302 || res.status === 301) {
    const location = res.headers.get('Location');
    if (location) {
      window.location.href = location;
      return;
    }
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Erro na exportação (${res.status})`);
  }

  const data = (await res.json()) as { url: string; filename?: string };
  if (data.url) {
    window.location.href = data.url;
  }
}
