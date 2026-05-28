import { Logo } from './Logo';

interface Props {
  children: React.ReactNode;
}

export function AuthLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page p-4">
      <div className="mb-6">
        <Logo variant="onLight" />
      </div>
      <div className="w-full max-w-md rounded-lg border border-border-default bg-surface-card p-6">
        {children}
      </div>
    </div>
  );
}
