exports.loglevel = true;
exports.loglevels = {
  quiet: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
}

getSite = (site) => {
  if (site && site.hasOwnProperty("name"))
    return site.name;
  if (typeof site === "string")
    return site;
  else 
    return JSON.stringify(site);
}

exports.debugSite = (site, msg) => {
  if (this.loglevel == this.loglevels.debug) {
    console.log("[DEBUG] " + getSite(site) + " - " + msg);
  }
}

exports.warnSite = (site, msg) => {
  if (this.loglevel >= this.loglevels.warn)
    console.log("[WARN] " + getSite(site) + " - " + msg);
}

exports.errorSite = (site, msg, error) => {
  if (this.loglevel >= this.loglevels.error) {
    console.log("[ERROR] " + getSite(site) + " - " + msg);
    if (error !== undefined) {
      console.log(error.stack);
    }
  }
}

exports.debug = (msg) => {
  if (this.loglevel == this.loglevels.debug) {
    console.log("[DEBUG]  - " + msg);
  }
}

exports.warn = (msg) => {
  if (this.loglevel >= this.loglevels.warn)
    console.log("[WARN] - " + msg);
}

exports.error = (msg, error) => {
  if (this.loglevel >= this.loglevels.error) {
    console.log("[ERROR] - " + msg);
    if (error !== undefined) {
      console.log(error.stack);
    }
  }
}

exports.info = (msg) => {
  if (this.loglevel >= this.loglevels.info)
    console.log("[INFO] - " + msg);
}