import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  // TypeScript errors now FAIL the build — production quality requires strict TS.
  // All 32 pre-existing TS errors have been fixed (see BUG-BASH worklog entry).
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,

  // --- Cache & Performance ---
  // Image optimization via sharp: convert served images to AVIF/WebP
  // automatically when next/image is used. Also allow SVGs (logos) and
  // external QR / image hosts used by the boutique publique.
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "yonukom.qrtags.pro" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // --- Static file serving for uploaded images ---
  // Uploaded images live in /app/uploads/{businessId}/{filename} (Coolify
  // persistent volume in production; ./.uploads in dev). They are served by
  // the dynamic route at /api/uploads/[...path]/route.ts which reads the
  // file from disk and streams it with the correct Content-Type + cache
  // headers.
  //
  // The rewrite below is a convenience: it allows clients to use the
  // shorter URL `/uploads/...` (no `/api` prefix) and have it forwarded
  // transparently to the dynamic route handler.
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },

  // --- Cache headers for static assets ---
  // Long-cache immutable build assets + public images/fonts.
  // In dev mode, Turbopack uses stable (non-content-hashed) chunk filenames,
  // so we MUST NOT send immutable headers — otherwise the browser caches
  // stale CSS forever and color/theme changes never reach the user.
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    return [
      {
        // Next.js hashed build assets (_next/static) are immutable in prod,
        // but must always revalidate in dev.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-cache, must-revalidate"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Public images (demo-store, demo-products, brand, hero-slides, onboarding)
        source: "/((?:demo-store|demo-products|brand|hero-slides|images|onboarding)/:path*)",
        headers: [
          { key: "Cache-Control", value: isDev ? "no-cache, must-revalidate" : "public, max-age=2592000" },
        ],
      },
      {
        // SVG/PNG/JPG/WEBP/AVIF at root of /public
        source: "/(.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico))",
        headers: [
          { key: "Cache-Control", value: isDev ? "no-cache, must-revalidate" : "public, max-age=2592000" },
        ],
      },
    ];
  },
};

export default nextConfig;
