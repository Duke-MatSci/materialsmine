const mongoose = require('mongoose');

const env = process.env.NODE_ENV;

const mongoConn = () => mongoose.connect(`mongodb://${env}:${env}@http://localhost:27017/testdb`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

module.exports = {
  mongoConn
};
