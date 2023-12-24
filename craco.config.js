const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...webpackConfig.resolve.alias,
          '@games': path.resolve(__dirname, 'src/games'),
        },
      };
      return webpackConfig;
    },
  },
};
