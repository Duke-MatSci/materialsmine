const express = require('express');
const mongoose = require('mongoose');
const { globalMiddleWare, log } = require('./middlewares/globalMiddleware');
const knowledgeRoutes = require('./routes/kgWrapper');
const adminRoutes = require('./routes/adminRoutes');
const searchRoutes = require('./routes/searchRoutes');
const elasticSearch = require('./utils/elasticSearch');
const env = process.env;

const app = express();
globalMiddleWare(app);
elasticSearch.ping(log);

app.use('/knowledge', knowledgeRoutes);
app.use('/admin', adminRoutes);
app.use('/search', searchRoutes);

app.use((error, req, res, next) => {
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
    app.listen(env.PORT || 3000);
  })
  .catch(err => console.log(err));
