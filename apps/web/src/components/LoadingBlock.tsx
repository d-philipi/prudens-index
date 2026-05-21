interface Props {
  message?: string;
}

export function LoadingBlock({ message = 'Carregando…' }: Props) {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-8 text-sm text-slate-600"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
        aria-hidden
      />
      <span>{message}</span>
    </div>
  );
}
