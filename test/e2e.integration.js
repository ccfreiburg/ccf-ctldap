const chai = require("chai")
const expect = chai.expect
chai.use(require("chai-as-promised"));

const log = require("../src/logging")
const config = require("../production/config.json")
const data = require("../production/ctdata.json")
const main = require("../src/main")
const ldap = require('ldapjs');

var client = {};


function searchWrapper(search, expectEntries, done, options) {
const entries = [];
const searchOptions = (options?options:{ scope: "base"})
client.search(search, searchOptions, (err,res)=>{
  res.on('searchEntry', 
    (entry) => {
      entries.push(entry);
  });   
  res.on('error', (err) => {
    log.debug(err)
    done()        
    chai.assert.fail(err.lde_message)
  });
  res.on('end', (result) => {
    expect(result.status).to.equal(0)
    expectEntries(entries) 
    done()
    });
  })
}

function boundSearchWrapper(search, expectEntries, done, options) {
  client.bind("cn=admin,dc=ccfreiburg,dc=de", "adminpw", (err) => {
    if (err) {
      done()
      chai.assert.fail(err.lde_message)
    } else {
      searchWrapper(search, expectEntries, 
          done, options )
    }
  })
}


describe("LDAP Client Server E2E Tests (e2e.integration)", () => {

  before( async () => {
    log.logger.level = 'silent'

    await main.start(config,
      async () => data,                                // data func mock
      (site) => async (u,p) => { return p==="alex" },  // pasword check mock
      (ip,port) => {});
    client = ldap.createClient({
      url: ['ldap://127.0.0.1:1389']
    });
    
    client.on('error', (err) => {
      log.debug(err)
    })
    
  })

  after( () => {
    main.ldapjs.stopServer();
    client.destroy();
  }
  )  
  it("LDAP server started and LDAP Client connected", (done) => { 
    const callback = (err, count) => {
      expect(count).to.equal(1)
      done()
    }
    main.ldapjs.getConnections(callback)
  });

  it("Get Schema", (done) => {
    searchWrapper(
      "dn=schema", 
      (entries) => {
        expect(entries[0].dn).to.equal("dc=ccfreiburg,dc=de")//"cn=root") 
      }, 
      done)
  })

  it("Auth Admin User", (done) => { 
    client.bind("cn=admin,dc=ccfreiburg,dc=de", "adminpw", (err) => {
      if (err) {
        chai.assert.fail(err.lde_message)
      } else {
        chai.assert(true)
      }
      done()
    })
  })

  it("Auth  Directory User", (done) => { 
    client.bind("cn=alex.roehm,ou=users,dc=ccfreiburg,dc=de", "alex", (err) => {
      if (err) {
        chai.assert.fail(err.lde_message)
      } else {
        chai.assert(true)
      }
      done()
    })
  })

  it("Get dc - groups fails with insuff rights", (done) => {
    client.search("ou=groups,dc=ccfreiburg,dc=de", (err,res)=>{
      res.on('searchEntry', (entry) => {
        chai.assert.fail("Should not receive entry")
        done()
      })   
      res.on('error', (err) => {
        expect(err).instanceOf(ldap.InsufficientAccessRightsError)
        done()        
      })
    })
  })

  it("Get dc - groups", (done) => {
    boundSearchWrapper(
      "ou=groups,dc=ccfreiburg,dc=de", 
      (entries) => {
        expect(entries).to.have.length.above(3)        
      }, 
      done)
  })

  it("Get dc - group detail", (done) => {
    boundSearchWrapper(
      "cn=kleingruppen,ou=groups,dc=ccfreiburg,dc=de", 
      (entries) => {
        expect(entries).to.have.length(1)
        expect(entries[0].dn).to.equal("cn=kleingruppen,ou=groups,dc=ccfreiburg,dc=de") 
      }, 
      done)
  })

  it("Get dc - users", (done) => {
    boundSearchWrapper(
      "ou=users,dc=ccfreiburg,dc=de", 
      (entries) => {
        expect(entries).to.have.length.above(10)        
      }, 
      done, { scope:"sub" })
  })
  
  it("Get dc - a user", (done) => {
    boundSearchWrapper(
      "cn=alex.roehm,ou=users,dc=ccfreiburg,dc=de", 
      (entries) => {
        expect(entries).to.have.length(1)        
      }, 
      done)
  })

  it("Get dc - groups and users", (done) => {
    boundSearchWrapper(
      "dc=ccfreiburg,dc=de", 
      (entries) => {
        expect(entries).to.have.length.above(13)        
      }, 
      done)
  })

  it("Get dc - query base dn", (done) => {
    boundSearchWrapper(
      "dc=ccfreiburg,dc=de", 
      (entries) => {
        expect(entries).to.have.length(1)        
        expect(entries[0].dn).to.equal("dc=ccfreiburg,dc=de")
      }, 
      done, { scope:"one" })
  })

  it("Get dc - query base dn like nextcloud for users", (done) => {
    boundSearchWrapper(
      "dc=ccfreiburg,dc=de", 
      (entries) => {
        expect(entries).to.have.length.above(13)        
      }, 
      done, { scope:"sub", filter: "(&(objectclass=nextclouduser)(displayname=*))" })
  })

  it("Get dc - query admin group", (done) => {
    boundSearchWrapper(
      "cn=admin,ou=groups,dc=ccfreiburg,dc=de", 
      (entries) => {
        expect(entries).to.have.length(1)        
      }, 
      done, { scope:"sub", filter: "(objectclass=group)" })
  })

  xit("Get dc - query throws", (done) => {
    searchWrapper(
      'cn=eroor,ou=error,dc=error,o=error', () => {}, done)
  })


  it("Get dc - query base dn like nextcloud", (done) => {
    const entries = [];
    const searchOptions =  {scope: "sub", filter: "(&(|(objectclass=nextclouduser)))"}
    client.bind("cn=admin,dc=ccfreiburg,dc=de", "adminpw", (err) => {
      if (err) {
        done()
        chai.assert.fail(err.lde_message)
      } else {
        client.search("dc=ccfreiburg,dc=de", searchOptions, (err,res)=>{
        res.on('searchEntry', 
          (entry) => {
            entries.push(entry);
      });   
      res.on('error', (err) => {
        log.debug(err)
        done()        
        chai.assert.fail(err.lde_message)
      });
      res.on('end', (result) => {
        expect(result.status).to.equal(0)
        done()
        });
      })
      
      }})
    })
});

