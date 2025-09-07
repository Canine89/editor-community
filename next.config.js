/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'localhost',
      // Vercel deployment domains
      'editor-community.vercel.app',
      // Supabase storage if used for images
      'nnllrgwnukqqepwkluja.supabase.co',
      // Unsplash for ad images
      'images.unsplash.com'
    ],
  },
  // PDF.js worker 설정 및 빌드 최적화
  webpack: (config) => {
    // PDF.js canvas 제거
    config.resolve.alias.canvas = false;
    
    // PDF.js worker 최적화
    config.resolve.alias['pdfjs-dist/build/pdf.worker.js'] = 'pdfjs-dist/build/pdf.worker.min.js';
    
    return config;
  },
  // 빌드 최적화
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
