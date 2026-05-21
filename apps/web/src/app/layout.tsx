import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prudens Index',
  description: 'Operational stock intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
