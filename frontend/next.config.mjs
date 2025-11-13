/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  eslint: {
    dirs: ['app', 'src']
  }
};

export default nextConfig;

