/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: '10mb',
        timeout: 600000
      },
    },
    pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
}

module.exports = nextConfig
  