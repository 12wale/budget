import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // These two values are Supabase's public URL and publishable/anon key.
  // Expose them to the browser bundle while allowing Vercel variable names
  // without the NEXT_PUBLIC_ prefix.
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
