/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/volunteer-admin/:path*",
        destination: "http://localhost:8090/api/v1/admin/volunteers/:path*",
      },
      {
        source: "/api/athletes/:id/epreuves",
        destination: "http://localhost:3001/athletes/:id/epreuves",
      },
      {
        source: "/api/athletes/:id/equipe",
        destination: "http://localhost:3001/athletes/:id/equipe",
      },
    ]
  },
}

export default nextConfig
