import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wgfgzxpfaslutmvioywy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false, // Allow optimization but with fallback
  },
};

export default nextConfig;
