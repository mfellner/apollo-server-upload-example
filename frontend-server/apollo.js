const { ApolloServer } = require('apollo-server-hapi');
const { processFileUploads } = require('apollo-server-core');
const { ApolloGateway } = require('@apollo/gateway');
const FileUploadDataSource = require('./file-upload-data-source');
// const { schema } = require('./graphql');

exports.registerApollo = async function registerApollo(server) {
  const graphqlPath = '/graphql';

  /**
   * Apollo federation and file upload not working:
   * https://github.com/apollographql/apollo-server/issues/3033
   * 
   * Hapi 17 multipart not working
   * https://github.com/apollographql/apollo-server/issues/1680
   *
   * Payload Parsing is not disabled using parse: false
   * https://github.com/hapijs/hapi/issues/3465
   */

  const apollo = new ApolloServer({
    path: graphqlPath,
    // schema,
    // Disable automatic upload handling. We'll do it manually instead.
    uploads: false,
    introspection: true,
    playground: true,
    subscriptions: false,
    gateway: new ApolloGateway({
      serviceList: [{ name: 'backend', url: 'http://localhost:4001/graphql' }],
      buildService: ({ url }) => new FileUploadDataSource({ url }),
    }),
  });

  // Manually handle file uploads to work around Hapi issues:
  await server.ext({
    type: 'onRequest',
    method: async (req, h) => {
      if (
        req.path === graphqlPath &&
        req.method === 'post' &&
        (req.raw.req.headers['content-type'] || '').includes('multipart/form-data')
      ) {
        // Prevent Hapi from trying to parse the request payload.
        req.route.settings.payload.parse = false;
        req.route.settings.payload.output = 'stream';
        // Process the file upload and store it for the onPreHandler.
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
};
