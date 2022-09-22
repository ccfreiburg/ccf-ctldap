const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const expect = chai.expect
const transform = require("../src/transform.js");
const ctdata = require("../production/ctdata.json");
const site = require("../production/config.json");
const ldap = require("../production/ldap.json");

describe("Transorm Production data to Ldap", () => {
  it.only("Equals Snapshot", () => {
    const ldapData = transform.getLdapDataFromChurchTools(site, ctdata)
    expect(ldapData).to.deep.equalInAnyOrder(ldap);
  })
});
