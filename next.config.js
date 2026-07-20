/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    reactStrictMode: true,
    images: {
        loader: 'default',
        unoptimized: true,
    },
    experimental: {
        optimizePackageImports: ['react-ga4'],
    },
    basePath: '',
    trailingSlash: true,
    sassOptions: {
        includePaths: ['./styles'],
    },
};

module.exports = nextConfig;
