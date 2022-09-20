const ctserv = require("../src/ctservice");
const { expect } = require("chai");

const log = require("../src/logging");
const site = require('../config.json')

before(() => log.loglevel = log.loglevels.quiet)


describe("CT API calls from service", () => {
  it("Selection Group returns the group info and personIds", async () => {
    const personIds = await ctserv.getPersonsInGroups(site.selectionGroupIds, site);
    expect(personIds.length).to.be.above(15)
    expect(personIds).to.contain(3)
    expect(personIds).to.contain(3041)
  })
  it("getPersonRecordsForId returns the detail info for a personId with ncuid set", async () => {
    const person = await ctserv.getPersonRecordForId(5, site);
    expect(person.id).to.be.equal(5)
    expect(person.ncuid).to.be.equal("alex.roehm")
  })
  it("getPersonRecordsForId returns the detail info for a personId with ncuid set", async () => {
    const person = await ctserv.getPersonRecordForId(3, site);
    expect(person.id).to.be.equal(3)
    expect(person.ncuid).to.be.equal("samuel.garrard")
  })
})