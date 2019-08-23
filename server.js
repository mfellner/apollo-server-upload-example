const { Server } = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const { ApolloServer } = require('apollo-server-hapi');
const { processFileUploads } = require('apollo-server-core');
const Handlebars = require('handlebars');
const path = require('path');
const WebpackPlugin = require('./webpack-plugin');
const { schema } = require('./graphql');
const webpackConfig = require('./webpack.config');

async function createServer() {
  const server = new Server({
    host: '0.0.0.0',
    port: 3000,
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

  const graphqlPath = '/graphql';

  /**
   * Hapi 17 multipart not working
   * https://github.com/apollographql/apollo-server/issues/2598
   *
   * Payload Parsing is not disabled using parse: false
   * https://github.com/hapijs/hapi/issues/3465
   */

  const apollo = new ApolloServer({
    path: graphqlPath,
    schema,
  });
  apollo.uploadsConfig = null;

  await server.ext({
    type: 'onRequest',
    method: async (req, h) => {
      if (
        req.path === graphqlPath &&
        req.method === 'post' &&
        (req.raw.req.headers['content-type'] || '').includes('multipart/form-data')
      ) {
        req.route.settings.payload.parse = false;
        req.route.settings.payload.output = 'stream';
        req.pre.payload = await processFileUploads(req.raw.req, req.raw.res);
      }
      return h.continue;
    },
  });

  await apollo.applyMiddleware({
    app: server,
    route: {
      cors: true,
      ext: {
        onPreHandler: {
          method: async (req, h) => {
            if (req.pre.payload) {
              req.payload = req.pre.payload;
            }
            return h.continue;
          },
        },
      },
    },
  });

  server.views({
    engines: { html: Handlebars },
    relativeTo: path.resolve(__dirname, 'frontend'),
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
  console.log('🚀 Server ready at http://localhost:3000');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
