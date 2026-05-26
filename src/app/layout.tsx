import type { Metadata } from 'next';
import StyledComponentsRegistry from '@/lib/registry';
import './globals.css';

export const metadata: Metadata = {
  title: 'Platenzen — Strava Stats',
  description: 'Visualizá tus estadísticas de Strava',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
