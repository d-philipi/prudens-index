interface Props {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-lg font-medium text-brand">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-[13px] text-text-subtitle">{subtitle}</p>
      ) : null}
    </header>
  );
}
