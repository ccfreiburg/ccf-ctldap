const c = require('./constants')
var ldapEsc = require('ldap-escape');

ldapcache = []

exports.init = (sitename, rootobj, admin) => {
  ldapcache[sitename].rootobj = rootobj
  ldapcache[sitename].admin = admin^
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
    addData: (users, groups) => {
      ldapcache[sitename].users.elements = users
      ldapcache[sitename].groups.elements = groups
    },
    getGroups: () => ldapcache[sitename].groups.elements,
    getUsers: () => ldapcache[sitename].users.elements
  }
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
