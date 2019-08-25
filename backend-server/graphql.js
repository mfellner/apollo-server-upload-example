const gql = require('graphql-tag');
const { buildFederatedSchema } = require('@apollo/federation');

const typeDefs = gql`
  # Enable file uploads:
  # https://www.apollographql.com/docs/apollo-server/features/file-uploads/
  scalar Upload

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  extend type Query {
    uploads: [File!]
  }

  extend type Mutation {
    uploadFile(file: Upload!): File!
  }
`;

const resolvers = {
  Query: {
    uploads: (root, args, context) => {
      return [];
    },
  },
  Mutation: {
    uploadFile: async (root, { file }, context) => {
      const { filename, mimetype, encoding, createReadStream } = await file;
      return { filename, mimetype, encoding };
    },
  },
};

exports.schema = buildFederatedSchema([
  {
    typeDefs,
    resolvers,
  },
]);
