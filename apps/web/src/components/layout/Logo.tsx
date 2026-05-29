type Variant = 'onDark' | 'onLight';

interface Props {
  variant?: Variant;
  collapsed?: boolean;
  className?: string;
}

export function Logo({ variant = 'onDark', collapsed = false, className = '' }: Props) {
  const ink = variant === 'onDark' ? 'text-white' : 'text-brand';

  if (collapsed) {
    return (
      <span
        className={`font-display text-base font-bold leading-none tracking-tight ${className}`}
        aria-label="Prudens Index"
      >
        <span className={ink}>P</span>
        <span className="text-brand-accent">I</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-block text-center font-display text-lg leading-none ${className}`}
      aria-label="Prudens Index"
    >
      <span className={`font-normal ${ink}`}>Prudens/</span>
      <span className={`font-bold ${ink}`}>IN</span>
      <span className="font-bold text-brand-accent">DEX</span>
    </span>
  );
}
