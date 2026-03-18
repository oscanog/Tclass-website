import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  distDir: "dist",

  turbopack: {
    root: projectRoot,
  },
  allowedDevOrigins: ["10.100.110.115"],

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      { protocol: "http", hostname: "localhost", port: "8000" },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
