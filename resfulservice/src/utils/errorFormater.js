const { ApolloError } = require('apollo-server-express');
const err = new ApolloError();

function errorFormater (message, code) {
  err.extensions.code = code;
  err.extensions.message = message;
  return err;
}

module.exports = errorFormater;
