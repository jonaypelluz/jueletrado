/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    sassOptions: {
        includePaths: ['./styles'],
    },
    // Ant Design v5 requires this transpilation for SSR
    transpilePackages: ['antd', '@ant-design/icons', 'rc-util', 'rc-pagination', 'rc-picker', 'rc-notification', 'rc-tooltip', 'rc-tree', 'rc-table'],
};

module.exports = nextConfig;
