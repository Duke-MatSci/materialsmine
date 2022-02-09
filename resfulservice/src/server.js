const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const acceptedHeaders = require('./middlewares/accept');
const getEnv = require('./middlewares/parseEnv');
const { fileMgr, fileServer } = require('./middlewares/fileStorage');
const mmGraphQL = require('./graphql');
// const testRoutes = require('./routes/test');
const env = process.env;

const app = express();

app.use(bodyParser.json());
app.use(fileMgr);
app.use('/mm_fils', fileServer);
app.use(acceptedHeaders);
app.use('/graphql', mmGraphQL);
app.use(getEnv);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

mongoose
  .connect(`mongodb://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.MONGO_ADDRESS}/${env.MM_DB}`, {
    useNewUrlParser: true, useUnifiedTopology: true
  })
  .then(app.listen(process.env.PORT || 3000))
  .catch(err => console.log(err));
