import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  // kaizen-lib se publica en TypeScript crudo (sin build propio): lo
  // transpila cada consumidor. Ver kaizen-lib/README.md § Instalación.
  transpilePackages: ["kaizen-lib"],
};

export default nextConfig;
