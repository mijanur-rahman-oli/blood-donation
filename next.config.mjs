/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,

  // Allow next/image to optimize remote assets served from Cloudinary and the
  // backend API (avatars, request attachments, etc.).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "blood-donation-server-weld-psi.vercel.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // Experimental flags used by the scaffold.
  cacheComponents: true,
  partialPrefetching: true,

  // Tailwind v4 is processed via the @tailwindcss/turbopack loader.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Forward common security-relevant headers from edge to origin.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
