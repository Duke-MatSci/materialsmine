const express = require('express');
const mongoose = require('mongoose');
const { globalMiddleWare, log } = require('./middlewares/globalMiddleware');
const knowledgeRoutes = require('./routes/kgWrapper');
const env = process.env;

const app = express();
globalMiddleWare(app);

app.use('/knowledge', knowledgeRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

mongoose
  .connect(`mongodb://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.MONGO_ADDRESS}:${env.MONGO_PORT}/${env.MM_DB}`, {
    useNewUrlParser: true, useUnifiedTopology: true
  })
  .then(() => {
    log.info('Rest server starting up...');
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => console.log(err));
