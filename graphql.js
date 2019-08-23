const gql = require('graphql-tag');
// const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = gql`
  # Enable file uploads:
  # https://www.apollographql.com/docs/apollo-server/features/file-uploads/
  # scalar Upload

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type Query {
    uploads: [File!]
  }

  type Mutation {
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
      console.log(file);
      const result = await file;
      console.log(
        'args:',
        typeof file,
        Object.keys(file),
        typeof result,
        Object.keys(result),
      );
      console.log(result);
      return result;
    },
  },
};

exports.typeDefs = typeDefs;
exports.resolvers = resolvers;

// exports.schema = makeExecutableSchema({ typeDefs, resolvers });
