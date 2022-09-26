const chai = require('chai');
const assertArrays = require('chai-arrays');
chai.use(assertArrays);
const expect = chai.expect;
const log = require('../src/logging');
const ctservice = require('../src/ctservice');

const site = {
  name: 'nopf',
  user: 'user',
  pass: 'pass',
  url: 'https://nopf.localmupf.mupf/',
};

describe('Church Tools Services', () => {
  before( () => {
    log.logger.level = 'silent'
  })
  it('getPersonsInGroups - gets unique person ids', async () => {
    ctservice.mockGetGroups((g, a, s) => {
      return {
        data: [
          { personId: 1 },
          { personId: 3 },
          { personId: 2 },
          { personId: 3 },
          { personId: 1 },
        ],
      };
    });
    const actual = await ctservice.getPersonsInGroups([], {});
    expect(actual).to.be.containingAllOf([1, 3, 2]);
  });
  it('getPersonsInGroups - gets person group relations', async () => {
    const expected = [
      { personId: 1, groupId: 1 },
      { personId: 3, groupId: 2 },
      { personId: 2, groupId: 1 },
      { personId: 3, groupId: 1 },
      { personId: 1, groupId: 2 },
    ];
    ctservice.mockGetGroups((g, a, s) => {
      return { data: expected };
    });
    const actual = await ctservice.getGroupMemberships([], {});
    expect(actual).to.be.ofSize(5);
    expect(actual[3].personId).to.be.equal(3);
    expect(actual[3].groupId).to.be.equal(1);
  });
  it('getGroups - gets group with id, guid, name', async () => {
    const expected = [
      { id: 1, guid: 1, name: 'ab' },
      { id: 3, guid: 2, name: 'cb' },
    ];
    ctservice.mockGetGroups((g, a, s) => {
      return { data: expected };
    });
    const actual = await ctservice.getGroups([], {});
    expect(actual).to.be.ofSize(2);
    expect(actual[1].id).to.be.equal(expected[1].id);
    expect(actual[1].guid).to.be.equal(expected[1].guid);
    expect(actual[1].name).to.be.equal(expected[1].name);
  });
});
