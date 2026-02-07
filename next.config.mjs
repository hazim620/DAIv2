/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dph2pdp0ht6hr.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
  // Configure PostCSS directly to avoid module type conflicts
  experimental: {
    // This ensures PostCSS config is loaded correctly
  },
}

export default nextConfig
