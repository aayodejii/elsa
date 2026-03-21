import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  // turbopack is the default bundler in Next.js 16 for dev
  turbopack: {
    resolveAlias: {
      // Turbopack picks the ESM bundle which has a static import from @mediapipe/selfie_segmentation
      // whose CJS IIFE exports Turbopack can't statically analyze.
      // Force the CJS build instead — require() is resolved at runtime, no static export analysis.
      "@tensorflow-models/body-segmentation": "@tensorflow-models/body-segmentation/dist/index.js",
    },
  },
  // webpack config applies for production builds
  webpack(config) {
    config.resolve.fallback = { fs: false, path: false };
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
