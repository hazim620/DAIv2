/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure PostCSS directly to avoid module type conflicts
  experimental: {
    // This ensures PostCSS config is loaded correctly
  },
}

export default nextConfig
