
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
    // allowedDevOrigins was removed as it's not a valid property here and was causing a server crash.
  },
  // We add allowedDevOrigins here to allow cross-origin requests from the dev environment.
  allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
      'https://*.firebase.studio',
  ],
  async headers() {
    return [
        {
            // Apply these headers to all routes in your application.
            source: '/:path*',
            headers: [
                {
                    key: 'Cross-Origin-Opener-Policy',
                    value: 'same-origin-allow-popups',
                },
                {
                    key: 'Cross-Origin-Embedder-Policy',
                    value: 'require-corp',
                },
            ],
        },
    ];
  },
};

export default nextConfig;
