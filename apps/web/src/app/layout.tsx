import type { Metadata } from 'next';
import ThemeRegistry from '@/lib/ThemeRegistry';
import AuthInitializer from '@/components/AuthInitializer';

export const metadata: Metadata = {
  title: 'Escolastica',
  description: 'Sistema de gestión académica',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeRegistry>
          <AuthInitializer />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
