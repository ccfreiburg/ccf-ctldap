const path = require("path");
const ldap = require("ldapjs");
const YAML = require('yamljs')
const log = require('./src/logging')
const transform = require('./src/transform')
const ctservice = require('./src/ctservice')
const ldapcache = require('./src/ldapcache')
const ldapserver = require('./src/ldapserver')
const c = require('./src/constants')

log.loglevel = log.loglevels.debug





  // dn: site.compatTransform(site.fnUserDn({ cn: cn })),
  //   attributes: {
  //   cn: cn,
  //     displayname: "Admin",
  //       id: 0,
  //         uid: "Admin",
  //           bbbrole: "admin",
  //             entryUUID: ,
  //   givenname: "Administrator",
  //     objectclass: [c.LDAP_OBJCLASS_USER, "simpleSecurityObject", "organizationalRole"],
  //   }


const initCache = (site) => {
  const siteCacheFunctions = ldapcache.init(
    site.name, 
    transform.getRootObj(site.ldap.dc, site.ldap.admin, site.ldap.o),
    transform.getAdmin(site.ldap.admincn, site.ldap.dc, site.ldap.password)
    )

  const allGoupsIds = site.selectionGroupIds.map((id) => id);
  site.tranformedGroups.forEach((element) => {
  if (!allGoupsIds.includes(element.gid))
      allGoupsIds.push(element.gid);
  });
  const churchtoolsdata = ctservice.getChurchToolsData(site.selectionGroupIds, allGoupsIds, site.site)

  const {users,groups} = getLdapDataFromChurchTools(site, churchtoolsdata)
  
  ldapcache.addData(site.name,users,groups)
  return siteCacheFunctions
}

const updateLdapServerData = (siteldap) => {
  // Todo implement an update strategy
}

function start() {
  log.info("Starting up CCF Ldap wrapper for ChurchTools ....")
  const config = YAML.load(c.CONFIG_FILE);
  log.debug(JSON.stringify(config))

  ldapjs = ldapserver.LdapServer(config.server)
  for (var site in config.sites) {
    const cacheFunctions = initCache(site)
    ldapjs.initSite(site.name, cacheFunctions)  
  }
  
  ldapjs.startUp(config.server)
}

start();