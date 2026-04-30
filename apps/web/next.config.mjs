/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@escolastica/shared'],
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs', 'nodemailer', 'exceljs', 'csv-parse'],
};

export default nextConfig;
