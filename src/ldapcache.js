const c = require('./constants')
var ldapEsc = require('ldap-escape');

ldapcache = []

exports.init = (sitename, rootobj, admin, password, ctAuthenticate) => {
  ldapcache[sitename].rootobj = rootobj
  ldapcache[sitename].admin = admin
  ldapcache[sitename].passwords = new Map()
  ldapcache[sitename].passwords.set(admin.dn, password)
  ldapcache[sitename].blocks = new Map()
  ldapcache[sitename].users = {
    "o": sitename,
    "ou": c.LDAP_OU_USERS,
    "cn": "ou=" + c.LDAP_OU_USERS + ",o=" + sitename,
    "elements": []
  }
  ldapcache[sitename].groups = {
    "o": sitename,
    "ou": c.LDAP_OU_GROUPS,
    "cn": "ou=" + c.LDAP_OU_USERS + ",o=" + sitename,
    "elements": []
  }
  ldapcache[sitename].ctAuthenticate = ctAuthenticate
  return {
    getGroups: () => ldapcache[sitename].groups.elements,
    getUsers: () => ldapcache[sitename].users.elements,
    getGlobals,
    checkAuthentication: (user, password) => checkPassword(sitename, user, password)
  }
}

exports.addData = (sitename, users, groups) => {
  ldapcache[sitename].users.elements = users
  ldapcache[sitename].groups.elements = groups
}

const getGlobals = () => {
  return { 
    rootDn: ldapcache[sitename].rootobj, 
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

const checkPassword = async (sitename, userDn, password) => {
    const sitecache = ldapcache[sitename]    
    if (isBlocked(sitecache, UserDn))
      return false;
    var valid = false;
    if (sitecache.passwords.has(userDn)) 
      valid = sitecache.passwords.get(userDn) === password
    if (!valid && userDn!==sitecache.admin.dn) {
      valid = await sitecache.ctAuthenticate(user, password)
      if (valid)
        sitecache.passwords.set(user,password)
    }
    if (valid) 
      removeBlock(sitecache, userDn)
    else  
      setBlock(sitecache, userDn)
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
    blocks.delete(UserDn)
  }
  return false;
}

removeBlock = (blocks, userDn) => {
  blocks.delete(userDn)
}

setBlock = (blocks, userDn) => {
  const block = blocks.get(userDn)
  block.loginErrorCount += 1;
  if (block.loginErrorCount > 5) {
      block.loginBlockedDate = new Date();
    }
  }
