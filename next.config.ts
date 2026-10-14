import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    resolveAlias: { "@/lib/runtime": "./lib/runtime.node.ts" },
  },
  webpack(config, { webpack }) {
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(
      /^@\/lib\/runtime$/,
      path.resolve(process.cwd(), "lib/runtime.node.ts"),
    ));
    return config;
  },
};

export default nextConfig;
