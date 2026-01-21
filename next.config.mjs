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
  // Configuration pour éviter les erreurs de chunks
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
      })
    }
    // Ajouter une configuration pour gérer les chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
        },
      },
    }
    return config
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
