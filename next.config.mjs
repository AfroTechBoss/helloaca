/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Skip static generation for auth pages
  async generateStaticParams() {
    return []
  },
  // Force all pages to be dynamic
  output: 'standalone',
}

export default nextConfig
