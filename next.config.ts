import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  // kaizen-lib se publica en TypeScript crudo (sin build propio): lo
  // transpila cada consumidor. Ver kaizen-lib/README.md § Instalación.
  transpilePackages: ["kaizen-lib"],
  // Las rutas pasaron a inglés. Las viejas pueden estar en marcadores o en la
  // PWA instalada: redirigen (la query, como `?lugar=` del mapa, se conserva).
  async redirects() {
    return [
      { source: "/mapa", destination: "/map", permanent: true },
      { source: "/perfil", destination: "/profile", permanent: true },
    ];
  },
};

export default nextConfig;
