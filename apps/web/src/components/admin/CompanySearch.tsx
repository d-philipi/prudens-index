'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function CompanySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`/admin${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar empresa por nome…"
        className="flex-1 rounded border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
      >
        Buscar
      </button>
    </form>
  );
}
