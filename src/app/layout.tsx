import type { Metadata, Viewport } from 'next';
import StyledComponentsRegistry from '@/lib/registry';
import RegistroServiceWorker from '@/components/pwa/RegistroServiceWorker';
import { InstalacionPWAProvider } from '@/components/pwa/useInstalacionPWA';
import './globals.css';

export const metadata: Metadata = {
  title: 'Platenzen — Estadísticas de running',
  description: 'Visualizá tus estadísticas de running',
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
        <StyledComponentsRegistry>
          {/*
            El provider envuelve a `children` y al registro juntos: `beforeinstallprompt`
            llega una sola vez, y tanto las pantallas como el botón flotante tienen que
            leerlo del mismo lugar.
          */}
          <InstalacionPWAProvider>
            {children}
            <RegistroServiceWorker />
          </InstalacionPWAProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
