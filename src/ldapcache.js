const c = require('./constants')
var ldapEsc = require('ldap-escape');

//site.adminDn = site.fnUserDn({ cn: config.ldap_user });
//site.CACHE = {};

ldapcache = []

exports.init = (sitename, rootObj) => {
  ldapcache[sitename].rootObj = rootObj
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
  return {
    addUser: (userdata) => addUSer(sitename, userdata, memberships),
    addGroup: (groupdata) => addUSer(sitename, groupdata),
    getGroups: () => getGroups(sitename),
    getUsers: () => getUsers(sitename)
  }
}


addUser = (sitename, userdata, memberships) => {
  ldapcache[sitename].users.push({
    dn: ldapEsc.dn("cn=${cn},ou=" + c.LDAP_OU_USERS + ",o=" + sitename, { cn: userdata.cn });


    cn: 
  })
}

site.fnUserDn = ldapEsc.dn("cn=${cn},ou=" + USERS_KEY + ",o=" + sitename);
site.fnGroupDn = ldapEsc.dn("cn=${cn},ou=" + GROUPS_KEY + ",o=" + sitename);
site.adminDn = site.fnUserDn({ cn: config.ldap_user });


exports.addAdmin = () => {
  var cn = config.ldap_user;
  newCache.push({
    dn: site.compatTransform(site.fnUserDn({ cn: cn })),
    attributes: {
      cn: cn,
      displayname: "Admin",
      id: 0,
      uid: "Admin",
      bbbrole: "admin",
      entryUUID: ,
      givenname: "Administrator",
      objectclass: [c.LDAP_OBJCLASS_USER, "simpleSecurityObject", "organizationalRole"],
    }
  });
}


exports.checkPlainPassword = function (password, siteconfig, callback) {
  if (siteconfig.loginBlockedDate) {
    var now = new Date();
    var checkDate = new Date(
      siteconfig.loginBlockedDate.getTime() + 1000 * 3600 * 24
    ); // one day
    if (now < checkDate) {
      callback(false);
      return;
    } else {
      siteconfig.loginBlockedDate = null;
      siteconfig.loginErrorCount = 0;
    }
  }
  var valid = password === siteconfig.ldap_password;
  if (!valid) {
    siteconfig.loginErrorCount += 1;
    if (siteconfig.loginErrorCount > 5) {
      siteconfig.loginBlockedDate = new Date();
    }
  }
  callback(valid);
};

exports.checkPassword = () => { };
