const c = require('./constants')
const log = require('./logging')
var ldapEsc = require('ldap-escape');
const { use } = require('chai');

ldapcache = []

const normalize = (astring) => {
  const str = astring
  return str.replace(", ",",").replace(", ",",").replace(", ",",")
}

exports.init = (sitename, rootobjects, admin, password, ctAuthenticate) => {
  ldapcache[sitename] = {};
  ldapcache[sitename].rootobj = rootobjects.dsn
  ldapcache[sitename].admin = admin
  ldapcache[sitename].passwords = new Map()
  const admindn = normalize(admin.dn)
  ldapcache[sitename].passwords.set(admindn, password)
  ldapcache[sitename].blocks = new Map()
  ldapcache[sitename].users = rootobjects.users 
    ldapcache[sitename].groups = rootobjects.groups
    ldapcache[sitename].ctAuthenticate = ctAuthenticate
  return {
    getGroups: () => ldapcache[sitename].groups.attributes.elements,
    getUsers: () => ldapcache[sitename].users.attributes.elements,
    setData: (users, groups) => addData(sitename,users,groups),
    getGlobals: () => getGlobals(sitename), 
    checkAuthentication: async (user, password) => await checkPassword(sitename, user, password)
  }
}

addData = (sitename, users, groups) => {
  ldapcache[sitename].users.attributes.elements = users
  ldapcache[sitename].groups.attributes.elements = groups
}

exports.getUserById = (sitename,id) => {
  const users = ldapcache[sitename].users.attributes.elements
  const user = users.find((u)=>u.attributes.id==id)
  return user;
}
exports.getGroupById = (sitename,id) => {
  const group = ldapcache[sitename].groups.attributes.elements.find((g)=>g.attributes.id==id)
  return group
}

const getGlobals = (sitename) => {
  return { 
    rootDn: ldapcache[sitename].rootobj, 
    userRoot: ldapcache[sitename].users, 
    groupRoot: ldapcache[sitename].groups, 
    adminDn: ldapcache[sitename].admin,
    schemaDn: {
      "dn": "cn=Subschema",
      "attributes": {
        "name": "SubschemaSubentry",
        "equality": "distinguishedNameMatch",
        "objectClass": ["top", "subschemaSubentry"],
        "attributeType": [],
        //"namingContexts": "o=" + req.dn.o,
      }
    }
  }
}

exports.getUserPropertyForAuth = (userdn, sitename) => {
  const user = ldapcache[sitename].users.attributes.elements.find((u)=>u.dn===userdn)
  log.debugSite(sitename,JSON.stringify(user))
  if (!user)
    return null
  return user.attributes.entryUUID
}

checkPassword = async (sitename, userDn, password) => {
    const sitecache = ldapcache[sitename]    
    const userdn = normalize(userDn)

    if (isBlocked(sitecache.blocks, userdn))
      return false;
    var valid = false;
    if (sitecache.passwords.has(userdn)) {
      valid = sitecache.passwords.get(userdn) === password
    } 
    if (!valid && userdn!=sitecache.admin.dn) {
      const login = this.getUserPropertyForAuth(userdn, sitename)
      valid = (login?await sitecache.ctAuthenticate(login, password):false)
      if (valid)
        sitecache.passwords.set(userdn,password)
    }
    if (valid) 
      removeBlock(sitecache.blocks, userdn)
    else  
      setBlock(sitecache.blocks, userdn)
    return valid
}

isBlocked = (blocks, userDn) => {
  if (!blocks.has(userDn))
    return false;
  const block = blocks.get(userDn)
  if (block.loginBlockedDate) {
    var now = new Date();
    var checkDate = new Date(
      block.loginBlockedDate.getTime() + 1000 * 3600 * 2
    ); // two hours
    if (now < checkDate) 
      return true;
    blocks.delete(userDn)
  }
  return false;
}

removeBlock = (blocks, userDn) => {
  blocks.delete(userDn)
}

setBlock = (blocks, userDn) => {
  var block = { loginErrorCount: 0 }
  if (blocks.has(userDn)) 
    block = blocks.get(userDn)
  else 
    blocks.set(userDn,block)
  block.loginErrorCount += 1;
  if (block.loginErrorCount > 5) {
      block.loginBlockedDate = new Date();
    }
  }
