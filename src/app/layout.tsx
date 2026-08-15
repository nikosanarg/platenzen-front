import type { Metadata, Viewport } from 'next';
import StyledComponentsRegistry from '@/lib/registry';
import RegistroServiceWorker from '@/components/pwa/RegistroServiceWorker';
import './globals.css';

export const metadata: Metadata = {
  title: 'Platenzen — Strava Stats',
  description: 'Visualizá tus estadísticas de Strava',
  applicationName: 'Platenzen',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Platenzen',
  },
};

// `themeColor` no va en `metadata` en Next 16 (tira warning de deprecación):
// vive en el export `viewport`. `#0d0d0f` es `--bg-primary` de globals.css.
export const viewport: Viewport = {
  themeColor: '#0d0d0f',
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
        <RegistroServiceWorker />
      </body>
    </html>
  );
}
