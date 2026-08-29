const log = (level, msg, ...args) => {
  const timestamp = new Date().toISOString();
  console[level === 'error' ? 'error' : 'log'](`[${timestamp}] [${level.toUpperCase()}] ${msg}`, ...args);
};

module.exports = {
  info: (msg, ...args) => log('info', msg, ...args),
  warn: (msg, ...args) => log('warn', msg, ...args),
  error: (msg, ...args) => log('error', msg, ...args),
  debug: (msg, ...args) => log('debug', msg, ...args)
};
