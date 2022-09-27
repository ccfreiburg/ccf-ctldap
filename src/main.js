const log = require('./logging')
const YAML = require('yamljs');
const ctservice = require('./ctservice')
const transform = require('./transform')
const ldapcache = require('./ldapcache')
const ldapserver = require('./ldapserver')

log.loglevel = log.loglevels.debug

const initCache = async (site, getChurchToolsDataFunc, authChurchToolsFunc) => {
  
  const adminuser = transform.getAdmin(site.ldap.admincn, site.ldap.dc)

  const siteCacheFunctions = ldapcache.init(
    site.site.name, 
    transform.getRootObj(site.ldap.dc, site.ldap.admin, site.ldap.o),  
    adminuser,  
    site.ldap.password,
    authChurchToolsFunc
    )
  const churchtoolsdata = await getChurchToolsDataFunc(site.selectionGroupIds, site.tranformedGroups, site.site)
  const {users,groups} = transform.getLdapData(site, churchtoolsdata, adminuser)
   
  ldapcache.addData(site.site.name,users,groups)
  return siteCacheFunctions
}

const updateLdapServerData = (siteldap) => {
  // Todo implement an update strategy
}

exports.getConfig = (file) => {
  return YAML.load(file)
}

exports.ldapjs = {}

exports.start = async (config, getChurchToolsDataFunc, authWithChurchToolsFunc, callback) => {
  log.info("Starting up CCF Ldap wrapper for ChurchTools ....")
  this.ldapjs = ldapserver.getLdapServer(config.server)

  for (const [key, value] of Object.entries(config.sites)) {
    const site = value;
    log.debugSite(site.site, "Get and transform data from ChurchTools")
    const cacheFunctions = await initCache(site, getChurchToolsDataFunc, authWithChurchToolsFunc(site))
    await this.ldapjs.initSite(site, cacheFunctions)  
  }

  log.debug("Done initializing data")
  this.ldapjs.startUp(callback)
  return (cb) => {
    this.ldapjs.stopServer();
    this.ldapjs.startUp(cb)
  }
}

exports.snapshot = async (site) => {
  const data = await ctservice.getChurchToolsData(site.selectionGroupIds, site.tranformedGroups, site.site)
  const adminuser = transform.getAdmin(site.ldap.admincn, site.ldap.dc)
  const ldap = transform.getLdapData(site, data, adminuser)
  return {
    data,
    ldap
  }
}
