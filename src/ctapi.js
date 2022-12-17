const axios = require('axios').default;
const log = require('./logging');

exports.ChurchToolsError = (message) => {
  const err = new Error(message);
  log.error(message);
  err.name = 'ChurchToolsError';
  return err;
};

exports.ChurchToolsFatalError = (message) => {
  const err = new Error(message);
  log.error(message);
  err.name = 'ChurchToolsFatalError';
  return err;
};

exports.result = (result, success, failed) => {
  if (result && Object.prototype.hasOwnProperty.call(result, 'data')) {
    if (success) success(result);
    log.debug(JSON.stringify(result.data));
    return result.data;
  } if (result && Object.prototype.hasOwnProperty.call(result, 'status') && result.status === 'success') {
    if (success) success(result);
    log.debug(JSON.stringify(result.data));
    return result.data;
  } if (result && Object.prototype.hasOwnProperty.call(result, 'message')) {
    if (failed) failed();
    throw this.ChurchToolsError(result.message);
  } else if (result && Object.prototype.hasOwnProperty.call(result, 'status')
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
