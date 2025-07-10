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
  // Support for very large file uploads (up to 50MB)
  serverExternalPackages: ['cloudinary'],
  experimental: {
    // Increase memory limits for large file processing
    largePageDataBytes: 128 * 1024, // 128KB
  },
}

export default nextConfig