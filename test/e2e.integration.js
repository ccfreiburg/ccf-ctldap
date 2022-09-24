const chai = require("chai")
const expect = chai.expect
chai.use(require("chai-as-promised"));

const log = require("../src/logging")
const config = require("../production/config.json")
const data = require("../production/ctdata.json")
const main = require("../src/main")
const ldap = require('ldapjs');

var client = {};

function searchWrapper(search, expectEntries, done) {
const entries = [];
client.search(search, (err,res)=>{
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

function boundSearchWrapper(search, expectEntries, done) {
  client.bind("cn=admin,dc=ccfreiburg,dc=de", "adminpw", (err) => {
    if (err) {
      done()
      chai.assert.fail(err.lde_message)
    } else {
      searchWrapper(search, expectEntries, 
          done )
    }
  })
}


describe("LDAP Client Server E2E Tests (e2e.integration)", () => {

  before( async () => {
    await main.start(config,
      async () => data,                                // data func mock
      (site) => async (u,p) => { return p==="alex" })  // pasword check mock
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
      done)
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
});
