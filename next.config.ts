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
};

export default nextConfig;
