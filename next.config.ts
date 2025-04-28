import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 本番ビルド時にTypeScriptの型エラーがあってもビルドを続行する
    ignoreBuildErrors: true,
  },
  eslint: {
    // 本番ビルド時にESLintエラーがあってもビルドを続行する
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
