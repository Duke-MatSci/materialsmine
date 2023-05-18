const express = require('express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const { createServer: createHttpServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer: useWsServer } = require('graphql-ws/lib/use/ws');
const { globalMiddleWare, log } = require('./middlewares');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/authService');
const curationRoutes = require('./routes/curation');
const elasticSearch = require('./utils/elasticSearch');
const fileRoutes = require('./routes/files');
const invalidRoutes = require('./routes/invalid');
const knowledgeRoutes = require('./routes/kg-wrapper');
const pixelatedRoutes = require('./routes/pixelated');
const searchRoutes = require('./routes/search');
const resolvers = require('./graphql/resolver');
const typeDefs = require('./graphql');
const getHttpContext = require('./graphql/context/getHttpContext');
const getWsContext = require('./graphql/context/getWsContext');

const env = process.env;

const app = express();
globalMiddleWare(app);
elasticSearch.ping(log);

app.use('/admin', adminRoutes);
app.use('/curate', curationRoutes);
app.use('/secure', authRoutes);
app.use('/files', fileRoutes);
app.use('/knowledge', knowledgeRoutes);
app.use('/search', searchRoutes);
app.use('/pixelated', pixelatedRoutes);
app.use('/*', invalidRoutes);

const httpServer = createHttpServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

const schema = makeExecutableSchema({ typeDefs, resolvers });
useWsServer({ schema, context: getWsContext }, wsServer);

const apolloServer = new ApolloServer({
  schema,
  formatError (err) {
    if (!err.extensions) {
      return err;
    }
    const message = err.extensions.message || 'An error occurred.';
    const code = err.extensions.code || 500;
    return { message, status: code };
  },
  context: getHttpContext
});

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

mongoose
  .connect(`mongodb://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.MONGO_ADDRESS}:${env.MONGO_PORT}/${env.MM_DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    log.info('Rest server starting up...');
    await apolloServer.start();
    apolloServer.applyMiddleware({ app, path: '/graphql' });
    httpServer.listen({ port: env.PORT }, () => {
      log.info(`Server running on port ${env.PORT}`);
      log.info(`GraphQL endpoint: http://localhost:${env.PORT}/graphql`);
    });
  })
  .catch((err) => console.log(err));
