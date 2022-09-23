var ldap = require('ldapjs');
const c = require('./constants');
const log = require('./logging');

log.loglevel = log.loglevels.debug

exports.getLdapServer = (server) => {
  if (server.crt && server.key) {
    var ldapCert = fs.readFileSync(server.crt, { encoding: 'utf8' });
    var ldapKey = fs.readFileSync(server.key, { encoding: 'utf8' });
    ldapjs = ldap.createServer({ certificate: ldapCert, key: ldapKey });
    log.info('LDAP Server started with ssl');
  } else {
    ldapjs = ldap.createServer();
    log.info('LDAP Server started without security (no ssl)');
  }
  return {
    initSite: (sitename, cacheFunctions) => initSite(sitename, cacheFunctions, ldapjs),
    startUp: () => startUp(server, ldapjs),
    getConnections: (cb) => ldapjs.getConnections(cb),
    stopServer: () => ldapjs.close()
  }
}

initSite = (sitename, cacheFunctions, ldapjs) => {
  function authorize(req, _res, next) {
    const adminDn = cacheFunctions.getGlobals().adminDn.dn;
    if (!req.connection.ldap.bindDN.equals(adminDn.dn)) {
      log.warnSite(sitename, 'Rejected search without proper binding!');
      return next(new ldap.InsufficientAccessRightsError());
    }
    return next();
  }

  function searchLogging(req, _res, next) {
    log.debugSite(
      sitename,
      'SEARCH base object: ' + req.dn.toString() + ' scope: ' + req.scope
    );
    log.debugSite(sitename, 'Filter: ' + req.filter.toString());
    return next();
  }

  function sendUsers(req, res, next) {
    var strDn = req.dn.toString();
    try {
      cacheFunctions.getUsers().forEach((user) => {
        if (
          (req.checkAll || parseDN(strDn).equals(parseDN(user.dn))) &&
          req.filter.matches(user.attributes)
        ) {
          log.debugSite(sitename, 'MatchUser: ' + user.dn);
          res.send(user);
        }
      });
    } catch (error) {
      log.errorSite(sitename, 'Error while retrieving users: ', error);
    }
    return next();
  }

  function sendGroups(req, res, next) {
    var strDn = req.dn.toString();
    try {
      cacheFunctions.getGroups().forEach((group) => {
        if (
          (req.checkAll || parseDN(strDn).equals(parseDN(group.dn))) &&
          req.filter.matches(g.attributes)
        ) {
          log.debugSite(sitename, 'MatchGroup: ' + g.dn);
          res.send(g);
        }
      });
    } catch (error) {
      logError(sitename, 'Error while retrieving groups: ', error);
    }
    return next();
  }

  function endSuccess(_req, res, next) {
    res.end();
    return next();
  }

  async function authenticate (req, _res, next) {
    var valid = await cacheFunctions.checkAuthentication(
      req.dn.toString(),
      req.credentials
    );
    if (!valid) {
      log.errorSite(sitename, 'Authentication error');
      return next(new ldap.InvalidCredentialsError());
    }
    log.debugSite(
      sitename,
      'Authentication successful for ' + req.dn.toString()
    );
    return next();
  };

  log.debugSite(sitename,"Resgistering routes")
  // Login bind for user
  ldapjs.bind(
    'ou=' + c.LDAP_OU_USERS + ',o=' + sitename,
    searchLogging,
    authenticate,
    endSuccess
  );

  // Search implementation for user search
  ldapjs.search(
    'ou=' + c.LDAP_OU_USERS + ',o=' + sitename,
    searchLogging,
    authorize,
    function (req, _res, next) {
      log.debugSite(sitename, 'Search for users');
      req.checkAll = req.scope !== 'base' && req.dn.rdns.length === 2;
      return next();
    },
    sendUsers,
    endSuccess
  );

  // Search implementation for group search
  ldapjs.search(
    'ou=' + c.LDAP_OU_GROUPS + ',o=' + sitename,
    searchLogging,
    authorize,
    function (req, _res, next) {
      log.debugSite(sitename, 'Search for groups');
      req.checkAll = req.scope !== 'base' && req.dn.rdns.length === 2;
      return next();
    },
    sendGroups,
    endSuccess
  );

  // Search implementation for user and group search
  ldapjs.search(
    'o=' + sitename,
    searchLogging,
    authorize,
    function (req, _res, next) {
      log.debugSite(sitename, 'Search for users and groups combined');
      req.checkAll = req.scope === 'sub';
      return next();
    },
    sendUsers,
    sendGroups,
    endSuccess
  );

  // Search the schema from LDAP Root DSE
  ldapjs.search(
    'cn=schema',
    function (req, res) {
      log.debug('Get subschema information');
      console.log(JSON.stringify(req));
      res.send(cacheFunctions.getGlobals().schemaDn);
      res.end();
    },
    endSuccess
  );

  // Search implementation for basic search for Directory Information Tree and the LDAP Root DSE
  ldapjs.search(
    '',
    function (req, res) {
      log.debug('empty request, return directory information');
      res.send(cacheFunctions.getGlobals().rootDn);
      res.end();
    },
    endSuccess
  );
  log.debugSite(sitename,"Routes registered")
  };

startUp = (server, ldapjs) => {
  ldapjs.listen(parseInt(server.port), server.ip, () => {
    log.info('ChurchTools-LDAP-Wrapper listening @ ' + ldapjs.url);
  });
};
