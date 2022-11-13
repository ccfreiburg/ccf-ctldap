const YAML = require('yamljs');
const log = require('./logging');
const ctservice = require('./ctservice');
const transform = require('./transform');
const ldapcache = require('./ldapcache');
const ldapserver = require('./ldapserver');

log.loglevel = log.loglevels.debug;

const initCache = async (site, getChurchToolsDataFunc, authChurchToolsFunc) => {
  const adminuser = transform.getAdmin(site.ldap.admincn, site.ldap.dc);

  const siteCacheFunctions = ldapcache.init(
    site.site.name,
    transform.getRootObj(site.ldap.dc, site.ldap.admin, site.ldap.o),
    adminuser,
    site.ldap.password,
    authChurchToolsFunc,
  );
  const churchtoolsdata = await getChurchToolsDataFunc(
    site.selectionGroupIds,
    site.tranformedGroups,
    site.site,
  );
  const { users, groups } = transform.getLdapData(
    site,
    churchtoolsdata,
    adminuser,
  );

  siteCacheFunctions.setData(users, groups);
  return siteCacheFunctions;
};

const updateSiteData = (
  site,
  getChurchToolsDataFunc,
  siteCacheFunctionsSetData,
) => new Promise(async (resolve) => {
  log.infoSite(site.site, 'Updating data from Church Tools');
  const data = await getChurchToolsDataFunc(
    site.selectionGroupIds,
    site.tranformedGroups,
    site.site,
  );
  const adminuser = transform.getAdmin(site.ldap.admincn, site.ldap.dc);
  const ldap = transform.getLdapData(site, data, adminuser);
  siteCacheFunctionsSetData(ldap.users, ldap.groups);
  resolve();
});

exports.getConfig = (file) => YAML.load(file);

exports.ldapjs = {};

exports.start = async (
  config,
  getChurchToolsDataFunc,
  authWithChurchToolsFunc,
  callback,
) => {
  log.info('Starting up CCF Ldap wrapper for ChurchTools ....');
  const updaters = new Map();
  this.ldapjs = ldapserver.getLdapServer(config.server);

  for (const [key, value] of Object.entries(config.sites)) {
    const site = value;
    log.debugSite(site.site, 'Get and transform data from ChurchTools');
    const cacheFunctions = await initCache(
      site,
      getChurchToolsDataFunc,
      authWithChurchToolsFunc(site),
    );
    await this.ldapjs.initSite(site, cacheFunctions);
    updaters.set(
      site.site.name,
      () => updateSiteData(site, getChurchToolsDataFunc, cacheFunctions.setData),
    );
  }
  log.debug('Done initializing data');
  this.ldapjs.startUp(callback);
  return {
    updaters,
    stop: () => this.ldapjs.stopServer(),
    restart: (cb) => {
      this.ldapjs.stopServer();
      this.ldapjs.startUp(cb);
    },
  };
};

exports.update = async (updaters) => {
  for await (const value of updaters.values()) {
    await value();
  }
};

exports.snapshot = async (site) => {
  const data = await ctservice.getChurchToolsData(
    site.selectionGroupIds,
    site.tranformedGroups,
    site.site,
  );
  const adminuser = transform.getAdmin(site.ldap.admincn, site.ldap.dc);
  const ldap = transform.getLdapData(site, data, adminuser);
  return {
    data,
    ldap,
  };
};
