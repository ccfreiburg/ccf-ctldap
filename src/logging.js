exports.loglevel = true;
exports.loglevels = {
  quiet: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
}

exports.debugSite = (site, msg) => {
  if (this.loglevel == this.loglevels.debug) {
    if (site && site.hasOwnProperty("name"))
      console.log("[DEBUG] " + site.name + " - " + msg);
    else if (typeof site === "string")
      console.log("[DEBUG] " + site + " - " + msg);
    else console.log("[DEBUG] " + JSON.stringify(site) + " - " + msg);
  }
};

exports.warnSite = (site, msg) => {
  if (this.loglevel >= this.loglevels.warn)
    console.log("[WARN] " + site.sitename + " - " + msg);
};

exports.errorSite = (site, msg, error) => {
  if (this.loglevel >= this.loglevels.error) {
    console.log("[ERROR] " + site.name + " - " + msg);
    if (error !== undefined) {
      console.log(error.stack);
    }
  }
};

exports.debug = (msg) => {
  if (this.loglevel == this.loglevels.debug) {
    console.log("[DEBUG]  - " + msg);
  }
};

exports.warn = (msg) => {
  if (this.loglevel >= this.loglevels.warn)
    console.log("[WARN] - " + msg);
};

exports.error = (msg, error) => {
  if (this.loglevel >= this.loglevels.error) {
    console.log("[ERROR] - " + msg);
    if (error !== undefined) {
      console.log(error.stack);
    }
  }
};

exports.info = (msg) => {
  if (this.loglevel >= this.loglevels.info)
    console.log("[INFO] - " + msg);
};