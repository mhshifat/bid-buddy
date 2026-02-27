import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js NOT to bundle these server-only packages with webpack.
  // They are loaded lazily at runtime via dynamic import() with try/catch,
  // so they gracefully degrade when not installed.
  serverExternalPackages: ["web-push", "twilio"],
  typescript: {
    ignoreBuildErrors: true,
  },
  // CORS for browser extension and web.
  // Note: Extension sends credentials: "include" for session auth. To allow
  // cookies in cross-origin extension requests, use middleware to set
  // Access-Control-Allow-Origin to the extension origin and
  // Access-Control-Allow-Credentials: true (cannot use * with credentials).
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
