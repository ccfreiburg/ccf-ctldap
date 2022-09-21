const path = require("path");
const ldap = require("ldapjs");
const YAML = require('yamljs')
const log = require('./src/logging')
const transform = require('./src/transform')
const ctservice = require('./src/ctservice')
const ldapcache = require('./src/ldapcache')
const c = require('./src/constants')

log.loglevel = log.loglevels.debug

log.info("Starting up CCF Ldap wrapper for ChurchTools ....")
const config = YAML.load(c.CONFIG_FILE);
log.debug(JSON.stringify(config))



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

const updateCache = (site, siteCacheFunctions) =>
{
    const siteTramsforms = transform.getSiteTransforms(site)

    const churchtoolsdata = ctservice.getChurchToolsData(site)
    const groups = siteTramsforms.getLdapGroupsWithoutMembers()
    const persons = siteTramsforms.getLdapUser()
    siteTramsforms.addMembersToGroups(groups, persons)

    ldapcache.update(site.name, persons, groups)
}

const initCahce = (site) => {
  const siteCacheFunctions = ldapcache.init(site.name, transform.getRootObj(site.ldap.dn, site.ldap.admin, site.ldap.o))
  updateCache(site, siteCacheFunctions)
  // Todo implement an update strategy
}

const updateLdapServerData = (siteldap) => {

}

const startLdapServer = (siteldap) => {
  updateLdapServerData(siteldap)
}

for (var site in config.sites) {
  initCahce(site)
}


// LdapCache.init( Root Object )
// LdapCache.addGroups( transform( read ) )
// LdapCache.addPersons( transform( read ) )


// const server = ldap.createServer();

// server.search("o=example", (req, res, next) => {
//   const obj = {
//     dn: req.dn.toString(),
//     attributes: {
//       objectclass: ["organization", "top"],
//       o: "example",
//     },
//   };
// });
// server.search("o=example", (req, res, next) => {
//   const obj = {
//     dn: "o=example",
//     attributes: {
//       objectclass: ["organization", "top", "dcObject"],
//       o: "example",
//       hasSubordinates: true,
//     },
//   };
//   if (req.filter.matches(obj.attributes)) res.send(obj);
//   res.end();
// });
// server.search("oc=top, cn=Subschema", (req, res, next) => {
//   const obj = {
//     dn: "oc=top, cn=Subschema",
//     attributes: {
//       parentTo: "all",
//     },
//   };
//   if (req.filter.matches(obj.attributes)) res.send(obj);
//   res.end();
// });

// server.search("", (req, res) => {
//   obj = rootobj;
//   if (req.filter.matches(obj.attributes)) res.send(obj);
//   res.end();
// });

// server.listen(1389, () => {
//   console.log("LDAP server listening at %s", server.url);
// });

// if (this.config.sites) {
//   Object.keys(this.config.sites).map((sitename) => {
//     var site = config.sites[sitename];
//     console.log(site + " Setting site config");
//   });
// }
