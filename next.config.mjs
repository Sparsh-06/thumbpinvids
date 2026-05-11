/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  api: {
    bodyParser: {
      sizeLimit: '200mb', // For larger videos
    },
    responseLimit: false, // Disable response limit completely (use with caution)
  },
  // Increase timeout for long-running video generation (in seconds)
  serverRuntimeConfig: {
    maxBodySize: '200mb',
  },
  // For Vercel deployment, increase max duration
  // (Vercel hobby plan limit is 10s, pro is 60s, enterprise is 300s+)
  maxDuration: 60, // seconds - only works on Vercel
};

export default nextConfig;
