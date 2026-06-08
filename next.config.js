// GitHub Pages serves this repo at /jueletrado/ (no custom domain), so the
// build needs that prefix. Locally (next dev/start) it must stay empty.
const repoName = 'jueletrado';
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    basePath: isGithubActions ? `/${repoName}` : '',
    assetPrefix: isGithubActions ? `/${repoName}/` : '',
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
