const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'frontend', 'index.js'),
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /\/node_modules\//,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              cacheDirectory: false,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: ['> 5% in alt-EU'],
                    },
                    modules: false,
                  },
                ],
                '@babel/preset-react',
              ],
            },
          },
        ],
      },
    ],
  },
};
