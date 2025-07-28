import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // This is a workaround for a Next.js issue with cloud-based development environments.
  experimental: {
    // This is required to allow requests from the development environment's origin.
    allowedDevOrigins: [
      "https://*.cloudworkstations.dev",
      "https://*.firebase.studio"
    ],
  },
};

export default nextConfig;
