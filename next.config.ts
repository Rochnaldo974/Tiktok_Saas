import type { NextConfig } from "next";

/* Content-Security-Policy notes:
   - script-src needs 'unsafe-eval' only in dev (React refresh);
     'unsafe-inline' covers Next's hydration bootstrap scripts.
   - style-src 'unsafe-inline' is required by generated gradient
     thumbnails (inline style attributes) — no external styles load.
   - connect-src is opened only to the Supabase project (auth +
     data); every other external host stays blocked. */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const connectSrc = ["'self'", supabaseUrl, supabaseUrl?.replace("https://", "wss://")]
  .filter(Boolean)
  .join(" ");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
