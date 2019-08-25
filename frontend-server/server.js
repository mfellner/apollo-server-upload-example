const { Server } = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const Handlebars = require('handlebars');
const path = require('path');
const WebpackPlugin = require('./webpack-plugin');
const webpackConfig = require('../webpack.config');
const { registerApollo } = require('./apollo');

async function createServer() {
  const server = new Server({
    host: '0.0.0.0',
    port: 4000,
  });

  await server.register(Vision);

  await server.register({
    plugin: WebpackPlugin,
    options: {
      publicPath: '/static',
      logLevel: 'warn',
      config: webpackConfig,
    },
  });

  await registerApollo(server);

  server.views({
    engines: { html: Handlebars },
    relativeTo: path.resolve(__dirname, '../frontend'),
    path: 'templates',
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: (req, h) => {
      return h.view('index', {});
    },
  });

  return server;
}

async function main() {
  const server = await createServer();

  await server.start();
  console.log('🚀 Server ready at http://localhost:4000');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
