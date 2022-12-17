const pino = require('pino');

exports.loglevel = true;
exports.loglevels = {
  quiet: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

exports.logger = pino({ level: 'debug' });

const getSite = (site) => {
  if (site && Object.prototype.hasOwnProperty.call(site, 'name')) return site.name;
  if (typeof site === 'string') return site;
  return JSON.stringify(site);
};

exports.debugSite = (site, msg) => {
  this.logger.debug(`${getSite(site)} - ${msg}`);
};

exports.infoSite = (site, msg) => {
  this.logger.info(`${getSite(site)} - ${msg}`);
};

exports.warnSite = (site, msg) => {
  this.logger.warn(`${getSite(site)} - ${msg}`);
};

exports.errorSite = (site, msg, error) => {
  this.logger.error(`${getSite(site)} - ${msg}`);
  if (error) this.logger.error(error);
};

exports.debug = (msg) => {
  this.logger.debug(msg);
};

exports.warn = (msg) => {
  this.logger.warn(msg);
};

exports.error = (msg) => {
  this.logger.error(msg);
};

exports.info = (msg) => {
  this.logger.info(msg);
};
