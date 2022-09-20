
getLdapServer = (key, crt) => {
  if (crt && key) {
    logDebug({ sitenmae: "Server" }, "Starting with ssl");
    var ldapCert = fs.readFileSync(crt, { encoding: "utf8" });
    var ldapKey = fs.readFileSync(config.ldap_key_filename, { encoding: "utf8" });
    return ldap.createServer({ certificate: ldapCert, key: ldapKey });
  } else {
    return ldap.createServer();
  }
}

setEventListenersForSite = (server, siteconfig) => {
  // Login bind for user
  server.bind("ou=" + USERS_KEY + ",o=" + sitename, function (req, _res, next) {
    req.site = config.sites[sitename];
    next();
  }, authenticate, endSuccess);

  // Search implementation for user search
  server.search("ou=" + USERS_KEY + ",o=" + sitename, function (req, _res, next) {
    req.site = config.sites[sitename];
    next();
  }, searchLogging, authorize, function (req, _res, next) {
    logDebug({ sitename: sitename }, "Search for users");
    req.checkAll = req.scope !== "base" && req.dn.rdns.length === 2;
    return next();
  }, requestUsers, sendUsers, endSuccess);

  // Search implementation for group search
  server.search("ou=" + GROUPS_KEY + ",o=" + sitename, function (req, _res, next) {
    req.site = config.sites[sitename];
    next();
  }, searchLogging, authorize, function (req, _res, next) {
    logDebug({ sitename: sitename }, "Search for groups");
    req.checkAll = req.scope !== "base" && req.dn.rdns.length === 2;
    return next();
  }, requestGroups, sendGroups, endSuccess);

  // Search implementation for user and group search
  server.search("o=" + sitename, function (req, _res, next) {
    req.site = config.sites[sitename];
    next();
  }, searchLogging, authorize, function (req, _res, next) {
    logDebug({ sitename: sitename }, "Search for users and groups combined");
    req.checkAll = req.scope === "sub";
    return next();
  }, requestUsers, requestGroups, sendUsers, sendGroups, endSuccess);

  // Search the schema from LDAP Root DSE
  server.search('cn=schema', function (req, res) {
    logDebug({ sitename: "?" }, " subschema information");
    console.log(JSON.stringify(req))
    var obj = {
      "dn": "cn=schema",
      "attributes": {
        "name": "SubschemaSubentry",
        "equality": "distinguishedNameMatch",
        "objectClass": ["top", "subschemaSubentry"],
        "attributeType": [],
      }
    };
    //if (req.filter.matches(obj.attributes))
    res.send(obj);
    res.end();
  }, endSuccess);

  // Search implementation for basic search for Directory Information Tree and the LDAP Root DSE
  server.search('', function (req, res) {
    logDebug({ sitename: req.dn.o }, "empty request, return directory information");
    var obj = {
      "dn": "",
      "attributes": {
        "objectClass": ["top", "RootDSE"],
        "subschemaSubentry": ["cn=schema"],
        //"namingContexts": "o=" + req.dn.o,
      }
    };
    if (req.filter.matches(obj.attributes))
      res.send(obj);
    res.end();
  }, endSuccess);
}

exports.startLdapServer = (serverconfig, siteconfig) => {
  var server = getLdapServer(serverconfig.key, serverconfig.crt)
  setEventListenersForSite(server, siteconfig)
  server.listen(parseInt(port), ip,
    () => {
      console.log('ChurchTools-LDAP-Wrapper listening @ %s', server.url);
    })
}