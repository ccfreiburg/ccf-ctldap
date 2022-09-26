const ctconn = require("../src/ctconnection");
const log = require("../src/logging");

const chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
chai.use(chaiAsPromised);

ChurchToolsError = ctconn.ChurchToolsError;

const config = require('../production/config.json')
const site = config.sites.ccf.site

describe("API call integration ctconnection", () => {
  before( () => {
    log.logger.level = 'silent'
  })  

  it("Info: gets info object", async () => {
    const result = await ctconn.infoReal(site.url)
    expect(result.shortName).to.equal("CCF")
  }).timeout(2000);

  it("getCsrfTokenReal: throws exception", async () => {
    const cookie = "";
    expect(ctconn.getCsrfTokenReal(site.url, cookie))
      .to.eventually.rejectedWith(ChurchToolsError)
  }).timeout(2000);

  it("loginPromise: login without helpfull data throws error", () => {
    con = ctconn.getEmptyConnection(site.name);
    con.baseurl = site.url;
    expect(
      ctconn.loginPromiseReal(con, "", "", "")
    ).to.be.eventually.rejectedWith(ChurchToolsError);
  });

  it("loginPromise: login works with real church tools access", async () => {
    con = ctconn.getEmptyConnection(site.name);
    con.baseurl = site.url;
    const result = await ctconn.loginPromiseReal(con, site.user, site.password)
    expect(result.status).to.be.equal("success");
  }).timeout(6000);

});
