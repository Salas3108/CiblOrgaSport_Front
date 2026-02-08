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
  async rewrites() {
    return [
      {
        source: "/api/athletes/:id/epreuves",
        destination: "http://localhost:3001/athletes/:id/epreuves",
      },
    ]
  },
}

export default nextConfig
