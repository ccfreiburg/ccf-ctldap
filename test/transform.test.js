const chai = require("chai");
const expect = chai.expect;
const transform = require("../src/transform.js");
//const userMockData = require("./data/getUsersData.json");

DataFormatError = transform.DataFormatError;

const siteconfig = {
  sitename: "site",
  userskey: "users",
  groupkey: "groups",
  objclassUsr: "CTPerson",
  dn_lower_case: true, // site.dn_lower_case || ((site.dn_lower_case === undefined) && config.dn_lower_case)
  email_lower_case: true, // || ((site.email_lower_case === undefined) && config.email_lower_case)
  emails_unique: false, //|| ((site.emails_unique === undefined) && config.emails_unique)
};
var sitetransform;
before(() => {
  sitetransform = transform.getSiteTransforms(siteconfig);
});
describe("Transorm API results to Ldap", () => {
  it("getCompatStringFunc true returns lowercase func", () => {
    expect(transform.getCompatStringFunc(true)).to.be.equal(
      transform.lowercase
    );
  });
  it("getCompatStringFunc false returns identity func", () => {
    expect(transform.getCompatStringFunc(false)).to.be.equal(
      transform.identity
    );
  });
  it("transform from empty json object throws exception", () => {
    expect(() => transform.transformUser({}, [], {})).to.throw(DataFormatError);
  });
  it("transform minmal json object does not throw", () => {
    actual = transform.transformUser(
      {
        id: 1,
        cmsuserid: "adMin",
      },
      [],
      sitetransform
    );
    expect(actual.dn).to.be.equal("cn=admin,ou=users,o=site");
    expect(actual.attributes.cn).to.be.equal("adMin");
    expect(actual.attributes.id).to.be.equal(1);
  });
});
