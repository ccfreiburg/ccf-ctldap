const log = require("./logging");
const c = require("./constants");
const axios = require("axios").default;


exports.ChurchToolsError = (message) => {
  err = new Error(message)
  log.error(message);
  err.name = "ChurchToolsError"
  return err;
}

exports.ChurchToolsFatalError = (message) => {
  err = new Error(message)
  log.error(message);
  err.name = "ChurchToolsFatalError"
  return err;
}

uriTrailingSlash = (uri) => (uri.slice(-1) !== "/" ? uri + "/" : uri);


exports.result = (result, success, failed) => {
  if (result && result.hasOwnProperty("status") &&
    [400, 401, 403, 404, 405, 500, 501, 502, 503, 504].includes(result.status)) {
    if (failed) failed();
    const message = result.data && result.data.message
      ? result.data.message
      : "No Session or connection problems";
    throw this.ChurchToolsError(message);
  } else if (result && result.hasOwnProperty("data")) {
    if (success) success(result);
    log.debug(JSON.stringify(result.data));
    return result.data
  } else if (result && result.hasOwnProperty("status") && result.status === "success") {
    if (success) success(result);
    log.debug(JSON.stringify(result.data));
    return result.data
  } else if (result && result.hasOwnProperty("message")) {
    if (failed) failed();
    throw this.ChurchToolsError(result.message);
  } else {
    log.error(JSON.stringify(result));
    throw this.ChurchToolsFatalError("Unexpected Error");
  }
}

exports.request = async (request, success, failed) => {
  log.debug(JSON.stringify(request))
  var result = {}
  try {
    result = await axios(request)
  } catch (err) {
    const message = err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : err.message;
    const error = this.ChurchToolsError(message);
    if (err.response) error.response = err.response;
    throw error;
  }
  return this.result(result, success, failed)
}
