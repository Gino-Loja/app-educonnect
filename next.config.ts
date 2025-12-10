import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname: string | undefined;

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    supabaseHostname = parsed.hostname;
  } catch (error) {
    console.warn("Invalid NEXT_PUBLIC_SUPABASE_URL, remote image patterns not configured.", error);
  }
}

const remotePatterns: RemotePattern[] = [];

if (supabaseHostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: supabaseHostname,
    pathname: "/storage/v1/object/public/**",
  });
}

remotePatterns.push(
  { protocol: "https", hostname: "**" },
  { protocol: "http", hostname: "**" },
);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns,
  },
  output: "standalone",

};

export default nextConfig;
