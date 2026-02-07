/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:5000/api/:path*', // Proxy to Flask in Dev
        },
        {
          source: '/LW/:path*',
          destination: 'http://127.0.0.1:5000/LW/:path*', // Proxy live wallpapers in Dev if needed
        },
      ]
      : [];
  },
};

export default nextConfig;
