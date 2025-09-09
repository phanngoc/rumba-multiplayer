import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables for backend API
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3005',
  },
  
  // Optimize for production
  poweredByHeader: false,
  
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  },
};

export default nextConfig;
