/** @type {import('next').NextConfig} */
const nextConfig = {
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
