const chai = require("chai")
expect = chai.expect

const config = require("../production/config.json")
const data = require("../production/ctdata.json")
const main = require("../src/main")
const ldap = require('ldapjs');

var client = {};

describe("LDAP Client Server E2E Tests (e2e.integration)", () => {

  before( async () => {
    await main.start(config, async () => data)
    client = ldap.createClient({
      url: ['ldap://127.0.0.1:1389']
    });
    
    client.on('error', (err) => {
      console.log(err)
    })
  })

  after( () => {
    //client.unbind();
    client.destroy();
    main.ldapjs.stopServer();
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
    client.search("dn=schema", (err,res)=>{
      res.on('searchEntry', (entry) => {
        console.log('entry: ' + JSON.stringify(entry.object));
        //expect(entry.dn).to.equal("cn=root")
      });   
      res.on('error', (err) => {
        chai.assert.fail(err)
        done()        
      });
      res.on('end', (result) => {
        console.log('status: ' + result.status);
        done()
      });
    })
  });

  xit("Get Groups", () => { });
  xit("Get Users", () => { });
  xit("Auth User", () => { });
});
