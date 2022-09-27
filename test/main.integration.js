const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const expect = chai.expect
const main = require('../src/main')

describe("Transorm Production data to Ldap", () => {
  it("Equals Snapshot", () => {
    const expected = require('../production/config.json')
    const actual = main.getConfig('./production/config.yml')
    expect(actual).to.deep.equalInAnyOrder(expected);
  })
  it("updates every - interval", () => {} )
});
