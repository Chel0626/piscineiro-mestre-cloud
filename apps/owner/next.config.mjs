/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera a pasta .next/standalone auto-contida para imagens Docker enxutas
  output: 'standalone',
  // Em monorepo, inclui arquivos da raiz (node_modules hoisted + workspaces) no standalone
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  transpilePackages: ['@piscineiro/shared'],
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // Evita que o browser tente buscar sourcemaps das fontes originais em dev
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = false;
    }
    return config;
  },
};

export default nextConfig;
