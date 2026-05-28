import { ClerkProvider } from '@clerk/nextjs';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-plus-jakarta',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Prudens Index',
  description: 'Operational stock intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="pt-BR"
        className={`light ${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable}`}
        style={{ colorScheme: 'light only' }}
      >
        <body className="min-h-screen bg-surface-page font-sans text-brand antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
