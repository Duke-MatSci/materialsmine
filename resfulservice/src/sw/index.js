const http = require('http');
const mongoose = require('mongoose');
const { log } = require('../middlewares');
const WorkerService = require('./utils/worker-services');
const Debouncer = require('./utils/debouncer');
const { ServiceWorkerDebouncerTimer } = require('../../config/constant');

const env = process.env;

const catchAllHandler = (_request, response) => {
  response.writeHead(200, {
    'Content-Type': 'application/json'
  });
  response.write(
    JSON.stringify({
      message: 'Hello from the service worker!'
    })
  );
  response.end();
};

const server = http.createServer(catchAllHandler);

mongoose
  .connect(
    `mongodb://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.MONGO_ADDRESS}:${env.MONGO_PORT}/${env.MM_DB}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => {
    server.listen({ port: env.WORKER_PORT }, () => {
      log.info(`Service worker listening on port ${env.WORKER_PORT}`);
    });
    const debouncedWorkerManager = Debouncer.debounce(
      WorkerService.workerManager,
      ServiceWorkerDebouncerTimer
    );
    debouncedWorkerManager(log);
  })
  .catch((err) => console.log(err));
