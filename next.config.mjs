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
        destination: "http://137.74.133.131/api/v1/admin/volunteers/:path*",
      },
      {
        source: "/api/athletes/:id/epreuves",
        destination: "http://137.74.133.131/athletes/:id/epreuves",
      },
      {
        source: "/api/athletes/:id/equipe",
        destination: "http://137.74.133.131/athletes/:id/equipe",
      },
    ]
  },
}

export default nextConfig
