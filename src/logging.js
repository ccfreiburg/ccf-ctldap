const pino = require('pino')

exports.loglevel = true;
exports.loglevels = {
  quiet: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
}

exports.logger = pino({ level: 'debug' })

getSite = (site) => {
  if (site && site.hasOwnProperty("name"))
    return site.name;
  if (typeof site === "string")
    return site;
  else 
    return JSON.stringify(site);
}

exports.debugSite = (site, msg) => {
 this.logger.debug(getSite(site) + " - " + msg)
  // if (this.loglevel == this.loglevels.debug) {
  //   console.log("[DEBUG] " + getSite(site) + " - " + msg);
  // }
}

exports.warnSite = (site, msg) => {
  this.logger.warn(getSite(site) + " - " + msg)
  // if (this.loglevel >= this.loglevels.warn)
  //   console.log("[WARN] " + getSite(site) + " - " + msg);
}

exports.errorSite = (site, msg, error) => {
  this.logger.error(getSite(site) + " - " + msg)
  if (error)
    this.logger.error(error)
  // if (this.loglevel >= this.loglevels.error) {
  //   console.log("[ERROR] " + getSite(site) + " - " + msg);
  //   if (error !== undefined) {
  //     console.log(error.stack);
  //   }
  // }
}

exports.debug = (msg) => {
  this.logger.debug(msg)
  // if (this.loglevel == this.loglevels.debug) {
  //   console.log("[DEBUG]  - " + msg);
  // }
}

exports.warn = (msg) => {
  this.logger.warn(msg)
  // if (this.loglevel >= this.loglevels.warn)
  //   console.log("[WARN] - " + msg);
}

exports.error = (msg, error) => {
  this.logger.error(msg)
  // if (this.loglevel >= this.loglevels.error) {
  //   console.log("[ERROR] - " + msg);
  //   if (error !== undefined) {
  //     console.log(error.stack);
  //   }
  // }
}

exports.info = (msg) => {
  this.logger.info(msg)
  // if (this.loglevel >= this.loglevels.info)
  //   console.log("[INFO] - " + msg);
}