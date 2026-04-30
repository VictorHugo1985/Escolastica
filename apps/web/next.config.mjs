/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@escolastica/shared'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs', 'nodemailer', 'exceljs', 'csv-parse'],
  },
};

export default nextConfig;
