const { RemoteGraphQLDataSource } = require('@apollo/gateway');
const { fetch, Request } = require('apollo-server-env');
const { isObject } = require('@apollo/gateway/dist/utilities/predicates');
const FormData = require('form-data');

module.exports = class FileUploadDataSource extends RemoteGraphQLDataSource {
  process(args) {
    const { request, context } = args;
    // TODO: support nested files, like https://www.npmjs.com/package/extract-files
    const fileVariables = Object.entries(request.variables || {}).filter(
      ([, value]) => value instanceof Promise,
    );

    if (fileVariables.length > 0) {
      return this.processFileUpload(request, fileVariables);
    } else {
      return super.process(args);
    }
  }

  async processFileUpload(request, fileVariables) {
    // GraphQL multipart request spec:
    // https://github.com/jaydenseric/graphql-multipart-request-spec
    const form = new FormData();

    const variables = request.variables;
    for (const [variableName] of fileVariables) {
      variables[variableName] = null;
    }
    const operations = JSON.stringify({
      query: request.query,
      variables,
    });
    form.append('operations', operations);

    const resolvedFiles = await Promise.all(
      fileVariables.map(async ([variableName, file]) => {
        const contents = await file;
        return [variableName, contents];
      }),
    );

    // e.g. { "0": ["variables.file"] }
    const fileMap = resolvedFiles.reduce(
      (map, [variableName], i) => ({
        ...map,
        [i]: [`variables.${variableName}`],
      }),
      {},
    );
    form.append('map', JSON.stringify(fileMap));

    await Promise.all(
      resolvedFiles.map(async ([, contents], i) => {
        const { filename, mimetype, createReadStream } = contents;
        const stream = await createReadStream();
        form.append(i, stream, { filename, contentType: mimetype });
      }),
    );

    // Respect incoming http headers (eg, apollo-federation-include-trace).
    const headers = (request.http && request.http.headers) || {};

    request.http = {
      method: 'POST',
      url: this.url,
      headers,
      headers: { ...headers, ...form.getHeaders() },
    };

    const options = {
      ...request.http,
      body: form,
    };

    const httpRequest = new Request(request.http.url, options);

    try {
      const httpResponse = await fetch(httpRequest);

      const body = await this.didReceiveResponse(httpResponse, httpRequest);

      if (!isObject(body)) {
        throw new Error(`Expected JSON response body, but received: ${body}`);
      }

      const response = {
        ...body,
        http: httpResponse,
      };

      return response;
    } catch (error) {
      this.didEncounterError(error, httpRequest);
      throw error;
    }
  }
};
