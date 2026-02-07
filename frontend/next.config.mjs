/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*', // Proxy to Flask
      },
      {
        source: '/LW/:path*',
        destination: 'http://127.0.0.1:5000/LW/:path*', // Proxy live wallpapers
      },
    ];
  },
};

export default nextConfig;
