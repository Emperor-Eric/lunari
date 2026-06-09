/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@lunari/ui',
    '@lunari/design-tokens',
    '@lunari/types',
    '@lunari/phase-data',
    '@lunari/utils',
  ],
}

module.exports = nextConfig
