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



{
  dn: site.compatTransform(site.fnUserDn({ cn: cn })),
    attributes: {
    cn: cn,
      displayname: "Admin",
        id: 0,
          uid: "Admin",
            bbbrole: "admin",
              entryUUID: ,
    givenname: "Administrator",
      objectclass: [c.LDAP_OBJCLASS_USER, "simpleSecurityObject", "organizationalRole"],
    }


  for (var site in config.sites) {
    const siteCacheFunctions = ldapcache.init(site.name, transform.getRootObj(site.ldap.dn, site.ldap.admin, site.ldap.o))
    const siteTramsforms = transform.getSiteTransforms(site)

    const configGroupIds = site.selectionGroupIds.map((id) => id)
    const ctPersonIds = await ctservice.getPersonsInGroups(configGroupIds, site.site)

    site.tranformedGroups.forEach(element => {
      if (!configGroupIds.includes(element.gid))
        configGroupIds.push(element.guid)
    });
    const ctGroups = await ctservice.getGroups(configGroupIds, site.site)

    const ctPersons = []
    for await (const id of ctPersonIds) {
      ctPersons.push(
        await ctservice.getPersonRecordForId(id, site.site)
      )
    }
    const ctGroupMembership = ctservice.getGroupMemberships(configGroupIds, site.site)

    siteTramsforms

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
