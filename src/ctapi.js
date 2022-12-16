const log = require('./logging');
const c = require('./constants');
const axios = require('axios').default;

exports.ChurchToolsError = (message) => {
  err = new Error(message);
  log.error(message);
  err.name = 'ChurchToolsError';
  return err;
};

exports.ChurchToolsFatalError = (message) => {
  err = new Error(message);
  log.error(message);
  err.name = 'ChurchToolsFatalError';
  return err;
};

uriTrailingSlash = (uri) => (uri.slice(-1) !== '/' ? `${uri}/` : uri);

exports.result = (result, success, failed) => {
  if (result && result.hasOwnProperty('data')) {
    if (success) success(result);
    log.debug(JSON.stringify(result.data));
    return result.data;
  } if (result && result.hasOwnProperty('status') && result.status === 'success') {
    if (success) success(result);
    log.debug(JSON.stringify(result.data));
    return result.data;
  } if (result && result.hasOwnProperty('message')) {
    if (failed) failed();
    throw this.ChurchToolsError(result.message);
  } else if (result && result.hasOwnProperty('status')
    && [400, 401, 403, 404, 405, 500, 501, 502, 503, 504].includes(result.status)) {
    if (failed) failed();
    throw this.ChurchToolsError('No Session or connection problems');
  } else {
    log.error(JSON.stringify(result));
    throw this.ChurchToolsFatalError('Unexpected Error');
  }
};

exports.request = async (request, success, failed) => {
  log.debug(JSON.stringify(request));
  let result = {};
  try {
    result = await axios(request);
  } catch (err) {
    throw this.ChurchToolsError(err.message);
  }
  return this.result(result, success, failed);
};
