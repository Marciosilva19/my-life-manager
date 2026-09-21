import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Os dados da workspace são sempre lidos no servidor (chave de serviço).
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
