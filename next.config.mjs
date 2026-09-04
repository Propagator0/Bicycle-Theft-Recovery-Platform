/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Shop CDNs the catalog harvester pulls reference images from.
    remotePatterns: [
      { protocol: 'https', hostname: '**.shopify.com' },
      { protocol: 'https', hostname: '**.shopifycdn.com' },
      { protocol: 'https', hostname: 'saleor.kargo.guru' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
  },
};
export default nextConfig;
