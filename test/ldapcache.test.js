const chai = require("chai")
const cache = require("../src/ldapcache")
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
chai.use(deepEqualInAnyOrder)
const expect = chai.expect

describe("LDAP Cache", () => {
  it("init - makes them available through returned functions", () => {
    const myRoot = { dn: "MyRoot" }
    const myAdmin = { dn: "MyAdmin" }
    const cachefunct = cache.init("vip", myRoot, myAdmin )
    expect(cachefunct.getGlobals().rootDn).to.deep.equalInAnyOrder(myRoot)
    expect(cachefunct.getGlobals().adminDn).to.deep.equalInAnyOrder(myAdmin)
    expect(cachefunct.getGlobals().schemaDn.dn).to.equals("cn=Subschema")
  })
  it("checkAuthentication - works for admin", async () => { 
    const myAdmin = "MyAdmin"
    const password = "pass1234"
    var wasCalled = false
    const ctAuthMock = () => {
      wasCalled = true
    }
    const cachefunct = cache.init("vip", {}, { dn: myAdmin }, password, ctAuthMock )
    const actual = await cachefunct.checkAuthentication(myAdmin, password)
    expect(actual).to.equal(true)
    expect(wasCalled).to.equal(false)
  })
  it("checkAuthentication - rejected for wrong admin password", async () => { 
    const myAdmin = "MyAdmin"
    const password = "pass1234"
    var wasCalled = false
    const ctAuthMock = () => {
      wasCalled = true
    }
    const cachefunct = cache.init("vip", {}, { dn: myAdmin }, password, ctAuthMock )
    const actual = await cachefunct.checkAuthentication(myAdmin, "wrongpassword")
    expect(actual).to.equal(false)
    expect(wasCalled).to.equal(false)
  })
  it("checkAuthentication - blocks admin after 5 trys even when password is then right", async () => { 
    const myAdmin = "MyAdmin"
    const password = "pass1234"
    var wasCalled = false
    const ctAuthMock = () => {
      wasCalled = true
    }
    const cachefunct = cache.init("vip", {}, { dn: myAdmin }, password, ctAuthMock )
    var actual = false
    var count = 0;
    while (!actual && count < 6) {
      actual = await cachefunct.checkAuthentication(myAdmin, "wrongpassword")
      count ++;
      expect(actual).to.equal(false)
    }
    expect(wasCalled).to.equal(false)
    actual = await cachefunct.checkAuthentication(myAdmin, password)
    expect(actual).to.equal(false)
  });
  it("checkAuthentication - does not block admin 4 trys even when password is then right", async () => { 
    const myAdmin = "MyAdmin"
    const password = "pass1234"
    var wasCalled = false
    const ctAuthMock = () => {
      wasCalled = true
    }
    const cachefunct = cache.init("vip", {}, { dn: myAdmin }, password, ctAuthMock )
    var actual = false
    var count = 0;
    while (!actual && count < 3) {
      actual = await cachefunct.checkAuthentication(myAdmin, "wrongpassword")
      count ++;
      expect(actual).to.equal(false)
    }
    expect(wasCalled).to.equal(false)
    actual = await cachefunct.checkAuthentication(myAdmin, password)
    expect(actual).to.equal(true)
  });
  it("checkAuthentication - for non admin calls handed function", async () => { 
    const myAdmin = "MyAdmn"
    var wasCalled = false
    var user = "user1"
    var password = "password2"
    const ctAuthMock = (u, p) => {
      wasCalled = true
      expect(u).to.equal(user)
      expect(p).to.equal(password)
    }
    const cachefunct = cache.init("vip", {}, { dn: "asdfas" }, "", ctAuthMock )
    const actual = await cachefunct.checkAuthentication(user, password)
    expect(wasCalled).to.equal(true)
  })
  it("checkAuthentication - blocks multiple failed auths also on external auth funct", async () => { 
    const user = "usrar"
    const trys = 10
    var count = 0
    const ctAuthMock = (u, p) => {
      count++
      return false
    }
    const cachefunct = cache.init("vip", {}, { dn: "myAdmin" }, "", ctAuthMock )
    var actual = await cachefunct.checkAuthentication(user, " adfsas")
    var i = 0
    while (i < trys) {
      i++
      actual = await cachefunct.checkAuthentication(user, "pas")
    }
    expect(actual).to.equal(false)
    expect(count).to.be.lessThan(trys)
  })
});
 