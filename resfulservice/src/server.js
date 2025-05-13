require('web-streams-polyfill/dist/polyfill.js');
const express = require('express');
const cluster = require('cluster');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const { createServer: createHttpServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer: useWsServer } = require('graphql-ws/lib/use/ws');
const swaggerUi = require('swagger-ui-express');
const { globalMiddleWare, log, swaggerService } = require('./middlewares');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/authService');
const curationRoutes = require('./routes/curation');
// const elasticSearch = require('./utils/elasticSearch');
const fileRoutes = require('./routes/files');
const invalidRoutes = require('./routes/invalid');
const knowledgeRoutes = require('./routes/kg-wrapper');
const pixelatedRoutes = require('./routes/pixelated');
const searchRoutes = require('./routes/search');
const managedServiceRoutes = require('./routes/managed-service');
const xmlRoutes = require('./routes/xml');
const resolvers = require('./graphql/resolver');
const typeDefs = require('./graphql');
const getHttpContext = require('./graphql/context/getHttpContext');
const getWsContext = require('./graphql/context/getWsContext');
const { latencyCalculator } = require('./middlewares/latencyTimer');
const { onExit } = require('./utils/exit-utils');

const env = process.env;
if (cluster.isMaster) {
  // Main process
  const app = express();
  globalMiddleWare(app);
  // TODO: Check - temporarily stopping this error from blowing up the server
  // elasticSearch.ping(log);

  const httpServer = createHttpServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });
  // Serve the Swagger UI
  const apiContractDocument = swaggerService(env);
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(apiContractDocument, { explorer: true })
  );

  app.use('/admin', adminRoutes);
  app.use('/curate', curationRoutes);
  app.use('/secure', authRoutes);
  app.use('/files', fileRoutes);
  app.use('/knowledge', knowledgeRoutes);
  app.use('/search', searchRoutes);
  app.use('/pixelated', pixelatedRoutes);
  app.use('/mn', managedServiceRoutes);
  app.use('/xml', xmlRoutes);
  app.use('/*', invalidRoutes);

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  useWsServer({ schema, context: getWsContext }, wsServer);

  const apolloServer = new ApolloServer({
    schema,
    formatError (err) {
      if (!err.extensions) {
        return err;
      }
      const message =
        err.message ?? err.extensions.exception.message ?? 'An error occurred.';
      const code = err.extensions.code || 500;
      log.error(`GQL Error: ${JSON.stringify(err)}`);
      return { message, status: code };
    },
    context: getHttpContext
  });

  app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    latencyCalculator(res);
    res.status(status).json({ message, data });
  });

  mongoose
    .connect(
      `mongodb://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.MONGO_ADDRESS}:${env.MONGO_PORT}/${env.MM_DB}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    )
    .then(async () => {
      log.info('Rest server starting up...');
      await apolloServer.start();
      apolloServer.applyMiddleware({ app, path: '/graphql' });
      httpServer.listen({ port: env.PORT }, () => {
        log.info(`Server running on port ${env.PORT}`);
        log.info(`GraphQL endpoint: http://localhost:${env.PORT}/graphql`);
      });
    })
    .catch((err) => onExit(err, log));
  // Fork the worker process
  cluster.fork();
} else {
  // Worker process
  require('./sw');
}

// Handle SIGINT signal (sent by Docker on container stop with Ctrl+C)
process.on('SIGINT', (e) => onExit(e, log));

// Handle SIGTERM signal (sent by Docker on container stop)
process.on('SIGTERM', (e) => onExit(e, log));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) =>
  onExit({ reason, promise }, log)
);

// Handle uncaught exceptions
process.on('uncaughtException', (e) => onExit(e, log));
