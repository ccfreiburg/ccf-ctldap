const chai = require('chai');
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const expect = chai.expect;
const main = require('../src/main');
const log = require('../src/logging');
const ldapcache = require('../src/ldapcache');

describe('Main: Production data to Ldap', () => {
  before(() => {
    log.logger.level = 'debug';
  });
  it('Equals Snapshot', () => {
    const expected = require('../production/config.json');
    const actual = main.getConfig('./production/config.yml');
    expect(actual).to.deep.equalInAnyOrder(expected);
  });
  xit('updates - on event (usualy triggerd by timer)', async () => {
    const config = require('../production/config.json');
    const data = {
      groups: [{ id: 1, guid: '1', name: 'group' }],
      persons: [
        {
          id: 2,
          guid: '2',
          firstName: 'Peter',
          lastName: 'Pan',
          nickname: '',
          street: '',
          mobile: '',
          phonePrivate: '',
          zip: '',
          city: '',
          cmsuserid: '',
          email: '',
          ncuid: '',
        },
      ],
      memberships: [{ personId: 2, groupId: 1 }],
    };
    const {updaters, stop} = await main.start(
      config,
      async () => data,      // data func mock
      () => {},  // pasword check mock
      () => { log.debug("Started") }               // server started cb
    ); 

    data.persons[0].lastName = 'Lustig';
    data.groups[0].name = 'updated';

    // simulate timer
    await main.update(updaters)

    expect(ldapcache.getUserById('ccf', 2).attributes.sn).to.equal('Lustig');
    expect(ldapcache.getGroupById('ccf', 1).attributes.cn).to.equal('updated');
    
    // test works but doesnot finsch - is in some async wait thing
  });
});
