//site.adminDn = site.fnUserDn({ cn: config.ldap_user });
//site.CACHE = {};

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

exports.checkPassword = () => {};
