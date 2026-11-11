import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@liquivault/sdk"],
  // The documented local SDK checkout lives next to this repository.
  turbopack: { root: fileURLToPath(new URL("..", import.meta.url)) },
};

export default nextConfig;
