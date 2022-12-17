const ldap = require('ldapjs');
const { parseDN } = require('ldapjs');
const fs = require('fs');
const c = require('./constants');
const log = require('./logging');

log.loglevel = log.loglevels.debug;

let ldapjs = {};

const stopServer = () => {
  ldapjs.close();
};

const startUp = (server, cb) => {
  const port = parseInt(server.port, 10);
  ldapjs.listen(port, server.ip, cb(server.ip, port));
};

const initSite = (site, cacheFunctions) => {
  const sitename = site.site.name;
  const { dc } = site.ldap;

  function authorize(req, _res, next) {
    const adminDn = cacheFunctions.getGlobals().adminDn.dn;
    if (!req.connection.ldap.bindDN.equals(adminDn)) {
      log.warnSite(sitename, 'Rejected search without proper binding!');
      return next(new ldap.InsufficientAccessRightsError());
    }
    return next();
  }

  function searchLogging(req, _res, next) {
    try {
      log.debugSite(
        sitename,
        `SEARCH base object: ${req.dn.toString()} scope: ${req.scope}`,
      );
      log.debugSite(sitename, `Filter: ${req.filter.toString()}`);
    } catch (err) {
      log.debug(req);
      log.debug(err);
    }
    return next();
  }

  function sendUsers(req, res, next) {
    const strDn = req.dn.toString();
    try {
      cacheFunctions.getUsers().forEach((user) => {
        if (
          parseDN(strDn).equals(parseDN(user.dn))
          || (!req.checkAll && req.filter.matches(user.attributes))
        ) {
          log.debugSite(sitename, `MatchUser: ${user.dn}`);
          res.send(user);
        }
      });
    } catch (error) {
      log.errorSite(sitename, 'Error while retrieving users: ', error);
    }
    return next();
  }

  function sendGroups(req, res, next) {
    const strDn = req.dn.toString();
    try {
      cacheFunctions.getGroups().forEach((group) => {
        if (
          parseDN(strDn).equals(parseDN(group.dn))
          || (!req.checkAll && req.filter.matches(group.attributes))
        ) {
          log.debugSite(sitename, `MatchGroup: ${group.dn}`);
          res.send(group);
        }
      });
    } catch (error) {
      log.errorSite(sitename, 'Error while retrieving groups: ', error);
    }
    return next();
  }

  function sendOrga(req, res, next) {
    const strDn = req.dn.toString();
    try {
      const glob = cacheFunctions.getGlobals();
      if (req.checkAll && parseDN(strDn).equals(parseDN(glob.rootDn.dn))) {
        res.send(glob.rootDn);
      }
      if (req.checkAll && parseDN(strDn).equals(parseDN(glob.groupRoot.dn))) {
        res.send(glob.groupRoot);
      }
      if (req.checkAll && parseDN(strDn).equals(parseDN(glob.userRoot.dn))) {
        res.send(glob.userRoot);
      }
    } catch (error) {
      log.errorSite(sitename, 'Error while retrieving groups: ', error);
    }
    return next();
  }

  function endSuccess(_req, res, next) {
    res.end();
    return next();
  }

  async function authenticate(req, _res, next) {
    try {
      const valid = await cacheFunctions.checkAuthentication(
        req.dn.toString(),
        req.credentials,
      );
      if (valid) {
        log.infoSite(
          sitename,
          `Authentication successful for ${req.dn.toString()}`,
        );
        return next();
      }
    } catch (err) {
      log.debug(err);
    }
    log.infoSite(
      sitename,
      `Authentication error ${req.dn.toString()}`,
    );
    return next(new ldap.InvalidCredentialsError());
  }

  log.debugSite(sitename, 'Resgistering routes');
  // Login bind for user
  ldapjs.bind(
    `ou=${c.LDAP_OU_USERS},${dc}`,
    (req, res, next) => {
      log.debugSite(sitename, `BIND dn: ${req.dn.toString()}`);
      next();
    },
    authenticate,
    endSuccess,
  );

  ldapjs.bind(
    // "cn=admin,dc=ccfreiburg,dc=de",
    cacheFunctions.getGlobals().adminDn.dn,
    (req, res, next) => {
      log.debugSite(sitename, `BIND dn: ${req.dn}`);
      next();
    },
    authenticate,
    endSuccess,
  );

  // Search implementation for user search
  ldapjs.search(
    `ou=${c.LDAP_OU_USERS},${dc}`,
    searchLogging,
    authorize,
    (req, _res, next) => {
      log.debugSite(sitename, 'Search for users');
      req.checkAll = (req.scope !== 'base' && req.scope !== 'sub')
        || req.dn.rdns.length > parseDN(dc).rdns.length + 1;
      return next();
    },
    sendUsers,
    endSuccess,
  );

  // Search implementation for group search
  ldapjs.search(
    `ou=${c.LDAP_OU_GROUPS},${dc}`,
    searchLogging,
    authorize,
    (req, _res, next) => {
      log.debugSite(sitename, 'Search for groups');
      req.checkAll = (req.scope !== 'base' && req.scope !== 'sub')
        || req.dn.rdns.length > parseDN(dc).rdns.length + 1;
      return next();
    },
    sendGroups,
    endSuccess,
  );

  // Search implementation for user and group search
  ldapjs.search(
    dc,
    searchLogging,
    authorize,
    (req, _res, next) => {
      log.debugSite(sitename, 'Search for users and groups combined');
      req.checkAll = req.scope !== 'base' && req.scope !== 'sub';
      return next();
    },
    sendUsers,
    sendGroups,
    sendOrga,
    endSuccess,
  );

  // Search the schema from LDAP Root DSE
  ldapjs.search(
    'cn=schema',
    (req, res) => {
      log.debug('Get subschema information');
      log.debug(JSON.stringify(req));
      res.send(cacheFunctions.getGlobals().schemaDn);
      res.end();
    },
    endSuccess,
  );

  // Search implementation for basic search for Directory Information Tree and the LDAP Root DSE
  ldapjs.search(
    '',
    (req, res) => {
      log.debug('empty request, return directory information');
      res.send(cacheFunctions.getGlobals().rootDn);
      res.end();
    },
    endSuccess,
  );

  // throw exception during search
  ldapjs.search(
    'cn=eroor,ou=error,dc=error,o=error',
    () => {
      throw new Error('for testing');
    },
    endSuccess,
  );

  log.debugSite(sitename, 'Routes registered');
};

exports.getLdapServer = (server) => {
  if (server.cert && server.key) {
    const ldapCert = fs.readFileSync(server.cert, { encoding: 'utf8' });
    const ldapKey = fs.readFileSync(server.key, { encoding: 'utf8' });
    ldapjs = ldap.createServer({
      log: log.logger,
      certificate: ldapCert,
      key: ldapKey,
    });
    log.info('LDAP Server started with ssl');
  } else {
    ldapjs = ldap.createServer({ log: log.logger });
    log.info('LDAP Server started without security (no ssl)');
  }
  return {
    initSite: (site, cacheFunctions) => initSite(site, cacheFunctions),
    startUp: (cb) => startUp(server, cb),
    getConnections: (cb) => ldapjs.getConnections(cb),
    stopServer: () => stopServer(),
  };
};
