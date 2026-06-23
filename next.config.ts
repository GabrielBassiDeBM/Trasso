import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Supabase Storage/REST/Realtime endpoints the client talks to directly.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

const cspHeader = `
  default-src 'self';
  script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: ${supabaseOrigin};
  font-src 'self' data:;
  connect-src 'self' ${supabaseOrigin} https://generativelanguage.googleapis.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
