const log = require("./logging");
const c = require("./constants");
const ctapi = require("./ctapi");
const axiosReal = require("axios").default;


var connectionPool = {};

exports.getEmptyConnection = (sitename, baseurl) => {
  var connection = {};
  connection.name = sitename;
  connection.baseurl = (baseurl ? baseurl : "");
  connection.cookie = "";
  connection.csrfToken = "";
  connection.loginPromise = null;
  connection.loginErrorCount = 0;
  connection.connected = false;
  return connection;
};

exports.getConnection = (site) => {
  if (!connectionPool.hasOwnProperty(site.name)) {
    connectionPool[site.name] = this.getEmptyConnection(site.name, site.url);
  }
  return connectionPool[site.name];
};

exports.isConnected = (sitename) => {
  if (!connectionPool.hasOwnProperty(sitename)) {
    return false;
  }
  return connectionPool[sitename].csrfToken.length > 0;
};

exports.disconnect = (connection) => {
  connection.csrfToken = ""
};

/**
 * Returns a promise for the login on the ChurchTools API.
 * If a pending login promise already exists, it is returned right away.
 */
exports.login = async (site) => {

  var conn = this.getConnection(site);
  if (conn.loginPromise) return Promise.resolve(conn.loginPromise);

  if (conn.loginErrorCount >= 3)
    throw ctapi.ChurchToolsFatalError("Too many failed logins in a row");

  var result = {}
  try {
    conn.loginPromise = loginPromise(conn, site.user, site.password)
    result = await conn.loginPromise;
  } catch (err) {
    result = err.response
  }
  conn.loginPromise = null;

  return ctapi.result(result,
    () => conn.loginErrorCount = 0,
    () => conn.loginErrorCount = conn.loginErrorCount + 1)
};

exports.infoReal = async (baseurl) => {
  const request = {
    method: "get",
    url: baseurl + c.API_SLUG + c.INFO_AP
  };
  return await ctapi.request(request)
};


exports.getCsrfTokenReal = async (baseurl, cookie) => {
  const request = {
    method: "get",
    url: baseurl + c.API_SLUG + c.CSRF_AP,
    headers: {
      Cookie: cookie,
    },
    json: true,
  }
  return await ctapi.request(request)
};


getCookie = (result) => {
  return result.headers["set-cookie"][0];
};

const loginfunc = async (conn, user, password) => {
  conn.csrfToken = "";
  const request = {
    method: "post",
    url: conn.baseurl + c.API_SLUG + c.LOGIN_AP,
    data: {
      "username": user,
      "rememberMe": false,
      "password": password
    }
  }
  const successfunc = (result) => {
    conn.cookie = getCookie(result);
  }
  const { data } = await ctapi.request(request, successfunc)
  conn.csrfToken = await getCsrfToken(conn.baseurl, conn.cookie);
  conn.loginPromise = null;
  log.info(conn.baseurl + " - CT API login completed");
  return data;
}

exports.loginPromiseReal = (conn, user, password) => {
  conn.loginPromise = loginfunc(conn, user, password)
  return conn.loginPromise;
};

exports.getPromiseReal = async (url, site) => {
  const conn = this.getConnection(site);
  var retryWithAuth = true
  var result = {}
  while (retryWithAuth) {
    retryWithAuth = false
    try {
      if (!this.isConnected(site.name)) {
        log.debug("Try again to log in")
        await this.login(site)
      }
      const reqest = {
        url: url,
        headers: {
          'Cookie': conn.cookie,
          'CSRF-Token': (conn.csrftoken ? conn.csrftoken : "")
        },
        json: true,
      }
      result = await axios(reqest)
      return ctapi.result(result)
    } catch (err) {
      if (err.name === "ChurchToolsError" || (err.response && err.response.status == 401)) {
        this.disconnect(conn)
        retryWithAuth = true;
      } else
        throw err
    }
  }
  return result
}

exports.get = (url, site) => getPromise(url, site);

// Mocks for internal functions

var axios = axiosReal;
var getPromise = this.getPromiseReal;
var loginPromise = this.loginPromiseReal;
var getCsrfToken = this.getCsrfTokenReal;
exports.setAxiosMock = (mock) => (axios = mock);
exports.setLoginMock = (login) => (loginPromise = login);
exports.setGetCsrfTokenMock = (getToken) => (getCsrfToken = getToken);
exports.setGetMock = (get) => (getPromise = get);
exports.resetMocks = () => {
  axios = axiosReal;
  getPromise = this.getPromiseReal;
  loginPromise = this.loginPromiseReal;
  getCsrfToken = this.getCsrfTokenReal;
}