interface Props {
  message?: string;
}

export function LoadingBlock({ message = 'Carregando…' }: Props) {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-lg border border-border-default bg-surface-card px-4 py-8 text-sm text-text-subtitle"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-border-default border-t-brand"
        aria-hidden
      />
      <span>{message}</span>
    </div>
  );
}
