const chai = require("chai");
const expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const log = require("../src/logging");
const ctapi = require("../src/ctapi");
const ctconn = require("../src/ctconnection");
ChurchToolsError = ctapi.ChurchToolsError;
ChurchToolsFatalError = ctapi.ChurchToolsFatalError;

const site = {
  name: "nopf",
  user: "user",
  password: "pass",
  url: "https://nopf.church.toys/",
};

describe("Church Tools Connection", () => {
  before( () => {
    log.logger.level = 'silent'
  })  

  it("getConnection for new site returns empty connection object", () => {
    var mysite = { ...site };
    mysite.name = "asdfgggg";
    actual = ctconn.getConnection(mysite);
    expect(actual).to.have.property("loginPromise");
    expect(actual.loginPromise).to.equal(null)
    expect(actual.name).to.equal(mysite.name);
  });
  it("getConnection returns existing connection object", () => {
    var mysite = { ...site };
    mysite.name = "asdfggg";
    expected = ctconn.getConnection(mysite);
    actual = ctconn.getConnection(mysite);
    expect(actual).to.equal(expected);
  });

  it("getConnection returns new one even if there is an existing connection object", () => {
    var mysite = { ...site };
    mysite.name = "asdggg";
    notexpected = ctconn.getConnection(site);
    actual = ctconn.getConnection(mysite);
    expect(actual).to.not.equal(notexpected);
  });

  it("login failed - throws ChurchToolsError", () => {
    var mysite = { ...site };
    mysite.name = "ola";
    ctconn.setLoginMock((c, b, u, p) => {
      return new Promise((resolve) => {
        resolve({ message: "login failed" });
      })
    })
    expect(ctconn.login(mysite)).to.eventually.throw(ChurchToolsError)
  }).timeout(2000);

  it("login failure reports the ChurchTools response message", async () => {
    const mysite = { ...site, name: "login-response-error" };
    ctconn.setLoginMock(() => {
      const error = new Error("Request failed with status code 401");
      error.response = {
        status: 401,
        data: { message: "Invalid credentials" }
      };
      throw error;
    });

    let loginError;
    try {
      await ctconn.login(mysite);
    } catch (error) {
      loginError = error;
    }
    expect(loginError).to.have.property("name", "ChurchToolsError");
    expect(loginError).to.have.property("message", "Invalid credentials");
  });

  it("login failure without an HTTP response preserves the error message", async () => {
    const mysite = { ...site, name: "login-no-response" };
    ctconn.setLoginMock(() => {
      throw new Error("Request failed with status code 401");
    });

    let loginError;
    try {
      await ctconn.login(mysite);
    } catch (error) {
      loginError = error;
    }
    expect(loginError).to.have.property("name", "ChurchToolsError");
    expect(loginError).to.have.property("message", "Request failed with status code 401");
    expect(ctconn.getConnection(mysite).loginErrorCount).to.equal(1);
  });

  it("login sends only cookie pairs when requesting the CSRF token", async () => {
    const connection = ctconn.getEmptyConnection("cookie-pairs", site.url);
    const originalRequest = ctapi.request;
    let csrfCookie;
    ctapi.request = async (request, success) => {
      if (request.method === "post") {
        success({
          headers: {
            "set-cookie": [
              "session=abc; Path=/; HttpOnly; Secure",
              "csrf=def; Path=/; SameSite=Lax"
            ]
          }
        });
        return { data: { status: "success" } };
      }
      csrfCookie = request.headers.Cookie;
      return "csrf-token-value";
    };

    try {
      await ctconn.loginPromiseReal(connection, site.user, site.password);
    } finally {
      ctapi.request = originalRequest;
    }

    expect(csrfCookie).to.equal("session=abc; csrf=def");
    expect(connection.csrfToken).to.equal("csrf-token-value");
  });

  it("login - prevents from too many login attempts", () => {
    var mysite = { ...site };
    mysite.name = "ola";
    ctconn.setLoginMock((c, b, u, p) => {
      return new Promise((resolve) => {
        resolve({ message: "login failed" });
      })
    })
    expect(
      new Promise(async (resolve) => {
        var i = 0;
        while (i < 5 && failed) {
          try {
            await ctconn.login(mysite)
          } catch (ChurchToolsError) {
          }
          i++;
        }
        resolve()
      }
      )).to.eventually.throw(ChurchToolsFatalError)
  }).timeout(2000);

  it("get - logs in, if no session", async () => {
    const expected = { data: { status: "success", data: { test: "test" } } };
    const site = ctconn.getEmptyConnection("amprf", "url")
    var loginCalled = false;
    ctconn.setLoginMock((c, b, u, p) => {
      loginCalled = true;
      return Promise.resolve({ data: {} });
    })
    ctconn.setAxiosMock((obj) => {
      return Promise.resolve(expected)
    })
    const actual = await ctconn.get("url", site)
    expect(loginCalled).to.equal(true)
    expect(actual).to.equal(expected.data);
  });

  it("get - sends the stored CSRF token", async () => {
    const expected = { data: { status: "success" } };
    const mysite = { ...site, name: "csrf-token" };
    let request;
    ctconn.setLoginMock((connection) => {
      connection.cookie = "session=abc";
      connection.csrfToken = "csrf-token-value";
      return Promise.resolve({ data: {} });
    });
    ctconn.setAxiosMock((config) => {
      request = config;
      return Promise.resolve(expected);
    });

    await ctconn.get("url", mysite);
    expect(request.headers.Cookie).to.equal("session=abc");
    expect(request.headers["CSRF-Token"]).to.equal("csrf-token-value");
  });

  it("get - trys to log in multiple times", async () => {
    const expected = { data: { status: "success", data: { test: "test" } } };
    var newsite = { ...site }
    newsite.name = "amprf";
    var loginCalls = 0;
    var axiosCalled = false;
    function LoginException() {
      const err = new Error("Kommst net rein")
      err.response = { status: 400 }
      return err
    }
    ctconn.setLoginMock((c, b, u, p) => {
      loginCalls++;
      if (loginCalls < 3)
        throw new LoginException();
      return Promise.resolve({ data: {} })
    })
    ctconn.setAxiosMock((obj) => {
      axiosCalled = true;
      if (loginCalls < 2)
        return Promise.resolve(false);
      return Promise.resolve(expected)
    })
    const actual = await ctconn.get("url", newsite)
    expect(loginCalls).to.equal(3)
    expect(axiosCalled).to.equal(true)
    expect(actual).to.equal(expected.data);
  });

  it("get - trys to log in gives up after n times", async () => {
    const expected = { data: { status: "success", data: { test: "test" } } };
    var newsite = { ...site }
    newsite.name = "amprdff";
    loginCalls = 0;
    function LoginException() {
      const err = new Error("Kommst net rein")
      err.response = { status: 401 }
      return err
    }
    ctconn.setLoginMock((c, b, u, p) => {
      loginCalls++
      throw new LoginException();
    })
    ctconn.setAxiosMock((obj) => {
      return Promise.resolve(false);
    })
    expect(ctconn.get("url", newsite)).to.eventually.throw(ChurchToolsFatalError)
  });
})