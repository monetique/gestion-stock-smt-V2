/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Activer ESLint en production, désactiver uniquement en développement si nécessaire
    ignoreDuringBuilds: process.env.NODE_ENV === 'production' ? false : process.env.ESLINT_DISABLE === 'true',
  },
  typescript: {
    // Activer TypeScript en production, désactiver uniquement en développement si nécessaire
    ignoreBuildErrors: process.env.NODE_ENV === 'production' ? false : process.env.TYPESCRIPT_DISABLE === 'true',
  },
  images: {
    unoptimized: true,
  },
  // Exclure les routes API du pre-rendering
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Configuration pour éviter les erreurs de build avec les routes API
  outputFileTracing: true,
  // Ne pas générer de pages statiques pour les routes API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
  // Ignorer les erreurs de connexion DB pendant le build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
      })
    }
    return config
  },
}

export default nextConfig
