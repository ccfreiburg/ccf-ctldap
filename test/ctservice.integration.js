const { expect } = require('chai');
const ctserv = require('../src/ctservice');

const log = require('../src/logging');
const config = require('../production/config.json');

const site = config.sites.ccf;

describe('CT API calls from service', () => {
  before(() => {
    log.logger.level = 'silent';
  });
  it('Selection Group returns the group info and personIds', async () => {
    const personIds = await ctserv.getPersonsInGroups(site.selectionGroupIds, site.site);
    expect(personIds.length).to.be.above(15);
    expect(personIds).to.contain(3);
    expect(personIds).to.contain(3041);
  });
  it('getPersonRecordsForId returns the detail info for a personId with ncuid set', async () => {
    const person = await ctserv.getPersonRecordForId(5, site.site);
    expect(person.id).to.be.equal(5);
    expect(person.ncuid).to.be.equal('alex.roehm');
  });
  it('getChurchToolsData - returns all the data', async () => {
    const data = await ctserv.getChurchToolsData(
      site.selectionGroupIds,
      site.tranformedGroups.map((v) => v.gid),
      site.site,
    );
    expect(data.groups.map((r) => r.id)).to.contain(692);
    expect(data.persons.map((r) => r.id)).to.contain(5);
    expect(data.persons.length).to.be.above(15);
    expect(data.memberships.find((r) => (r.personIds = 5 && r.groupId == 692)));
  }).timeout(10000);
});
