const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const expect = chai.expect
const transform = require("../src/transform.js");
const ctdata = require("../production/ctdata.json");
const site = require("../production/config.json");
const ldap = require("../production/ldap.json");

describe("Transorm Production data to Ldap", () => {
  it("Equals Snapshot", () => {
    const ldapconf = site.sites.ccf.ldap
    const adminuser = transform.getAdmin(ldapconf.admincn, ldapconf.dc)
    const ldapData = transform.getLdapData(site.sites.ccf, ctdata, adminuser)
    expect(ldapData).to.deep.equalInAnyOrder(ldap);
  })
});
