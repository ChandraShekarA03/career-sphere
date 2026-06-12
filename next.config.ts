import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow server-side packages that use native bindings
  serverExternalPackages: ['pdf-parse'],

  // Turbopack config (empty = use defaults, silences the warning)
  turbopack: {},

  // Image domains for org logos (future use)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'internshala.com' },
      { protocol: 'https', hostname: 'unstop.com' },
    ],
  },
}

export default nextConfig
