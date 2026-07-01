/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone is for Docker/self-host only; Netlify uses @netlify/plugin-nextjs instead.
  ...(process.env.NETLIFY ? {} : { output: 'standalone' }),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
