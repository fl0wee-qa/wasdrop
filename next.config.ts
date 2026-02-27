import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "shared.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "shared.fastly.steamstatic.com" },
      { protocol: "https", hostname: "images.igdb.com" },
      { protocol: "https", hostname: "www.cheapshark.com" },
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "assets-prd.ignimgs.com" },
      { protocol: "https", hostname: "static1.srcdn.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "sttc.gamersgate.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
