// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScriptのビルドエラーを無視
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLintのチェックを無視
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
