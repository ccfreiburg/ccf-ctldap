const log = require('./logging')
const transform = require('./transform')
const ldapcache = require('./ldapcache')
const ldapserver = require('./ldapserver')

log.loglevel = log.loglevels.debug

const initCache = async (site, getChurchToolsDataFunc, authChurchToolsFunc) => {
  const siteCacheFunctions = ldapcache.init(
    site.site.name, 
    transform.getRootObj(site.ldap.dc, site.ldap.admin, site.ldap.o),    
    transform.getAdmin(site.ldap.admincn, site.ldap.dc),
    site.ldap.password,
    authChurchToolsFunc
    )

  const allGoupsIds = site.selectionGroupIds.map((id) => id);
  site.tranformedGroups.forEach((element) => {
  if (!allGoupsIds.includes(element.gid))
      allGoupsIds.push(element.gid);
  });
  const churchtoolsdata = await getChurchToolsDataFunc(site.selectionGroupIds, allGoupsIds, site.site)

  const {users,groups} = transform.getLdapDataFromChurchTools(site, churchtoolsdata)
  
  ldapcache.addData(site.site.name,users,groups)
  return siteCacheFunctions
}

const updateLdapServerData = (siteldap) => {
  // Todo implement an update strategy
}

exports.ldapjs = {}

exports.start = async (config, getChurchToolsDataFunc, authWithChurchToolsFunc) => {
  log.info("Starting up CCF Ldap wrapper for ChurchTools ....")
  this.ldapjs = ldapserver.getLdapServer(config.server)

  for (const [key, value] of Object.entries(config.sites)) {
    const site = value;
    log.debugSite(site.site, "Get and transform data from ChurchTools")
    const cacheFunctions = await initCache(site, getChurchToolsDataFunc, authWithChurchToolsFunc(site))
    await this.ldapjs.initSite(site, cacheFunctions)  
  }

  log.debug("Done initializing data")
  this.ldapjs.startUp(config.server)
}
