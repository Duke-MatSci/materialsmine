const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, prettyPrint } = format;

const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const transport = {
  file: new (transports.File)({
    filename: '/app/logs/rest_api.log',
    level: 'debug',
    maxfiles: 10,
    maxsize: 52428800
  })
};

exports.mmLogger = () => {
  if (!fs.existsSync('/app/logs')) {
    fs.promises.mkdir('/app/logs/', { recursive: true }).catch(console.error);
  }
  const logger = createLogger({
    levels: {
      emerg: 0,
      alert: 1,
      crit: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7
    },
    format: combine(
      label({ label: 'rest-api' }),
      timestamp(),
      prettyPrint(),
      logFormat
    ),
    transports: [
      transport.file
    ]
  });
  return logger;
};

exports.logParser = (logger, req, next) => {
  req.logger = logger;
  next();
};
