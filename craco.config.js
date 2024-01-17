const path = require('path');

module.exports = {
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            webpackConfig.resolve = {
                ...webpackConfig.resolve,
                alias: {
                    ...webpackConfig.resolve.alias,
                    '@games': path.resolve(__dirname, 'src/games'),
                    '@config': path.resolve(__dirname, 'src/config'),
                    '@hooks': path.resolve(__dirname, 'src/hooks'),
                    '@models': path.resolve(__dirname, 'src/models'),
                    '@store': path.resolve(__dirname, 'src/store'),
                    '@services': path.resolve(__dirname, 'src/services'),
                    '@tests': path.resolve(__dirname, '__tests__'),
                    '@mocks': path.resolve(__dirname, '__tests__/__mocks__'),
                },
            };
            return webpackConfig;
        },
    },
};
