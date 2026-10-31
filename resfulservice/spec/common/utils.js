exports.logger = {
  emerg: (log) => (console.log(log)),
  alert: (log) => (console.log(log)),
  crit: (log) => (console.log(log)),
  error: (log) => (console.log(log)),
  warn: (log) => (console.log(log)),
  warning: (log) => (console.log(log)), // TODO: Remove once all callers use .warn() instead
  notice: (log) => (console.log(log)),
  info: (log) => (console.log(log)),
  debug: (log) => (console.log(log))
};
