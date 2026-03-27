import os from "node:os";
import type { NextConfig } from "next";

function getAllowedDevOrigins(): string[] {
  const origins = new Set(["localhost", "127.0.0.1"]);

  try {
    for (const addresses of Object.values(os.networkInterfaces())) {
      for (const address of addresses || []) {
        if (address.family === "IPv4" && !address.internal) {
          origins.add(address.address);
        }
      }
    }
  } catch {
    return Array.from(origins);
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
