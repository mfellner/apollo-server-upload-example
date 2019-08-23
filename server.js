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

  const graphqlPath = '/graphql';

  const apollo = new ApolloServer({
    path: graphqlPath,
    typeDefs,
    resolvers,
  });

  await server.ext({
    type: 'onRequest',
    method: async function(req, h) {
      if (
        req.path === graphqlPath &&
        req.method === 'post' &&
        req.raw.req.headers['content-type'].indexOf('multipart/form-data') !==
          -1
      ) {
        req.mime = 'multipart/form-data';
      }
      return h.continue;
    },
  });

  await apollo.applyMiddleware({
    app: server,
    route: {
      cors: true,
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
