const { Server } = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const { ApolloServer } = require('apollo-server-hapi');
const Handlebars = require('handlebars');
const path = require('path');
const WebpackPlugin = require('./webpack-plugin');
const { typeDefs, resolvers } = require('./graphql');

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
      config: {
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
      },
    },
  });

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
  });

  console.log('apollo.uploadsConfig', apollo.uploadsConfig);

  await apollo.applyMiddleware({
    app: server,
    route: {
      cors: true,
      ext: {
        /**
         * This handler will be called before the Apollo GraphQL handler.
         * By calling getCombinedSchema we ensure that the GraphQL schema is up-to-date.
         */
        onPreHandler: {
          method: async (req, h) => {
            console.log('onPre', req.mime);
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
