const webpack = require('webpack');
const createWebpackDevMiddleware = require('webpack-dev-middleware');

function register(server, options) {
  const compiler = webpack(options.config);
  const webpackDevMiddleware = createWebpackDevMiddleware(compiler, {
    publicPath: options.publicPath,
    logLevel: options.logLevel,
  });

  server.ext({
    type: 'onRequest',
    method: async ({ raw: { req, res } }, h) => {
      try {
        await new Promise((resolve, reject) => {
          webpackDevMiddleware(req, res, error => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        return h.continue;
      } catch (err) {
        throw err;
      }
    },
  });
}

exports.plugin = {
  name: 'webpack',
  register,
};
