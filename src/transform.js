var ldapEsc = require("ldap-escape");
const crypto = require('crypto');

class DataFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataFormatError";
  }
}
exports.lowercase = (s) => (typeof s === "string" ? s.toLowerCase() : s);
exports.identity = (s) => s;
exports.uniqueEmails = (users) => {
  var mails = {};
  return users.filter((user) => {
    if (!user.attributes.email) {
      return false;
    }
    var result = !(user.attributes.email in mails);
    mails[user.attributes.email] = true;
    return result;
  });
};
exports.stringConvLowercaseUmlaut = (str) => {
  return str
    .toLowerCase()
    .replace("ö", "oe")
    .replace("ä", "ae")
    .replace("ü", "ue")
    .replace("ß", "ss");
}
exports.generateUUID = () => {
  return crypto.randomUUID()
}

function groupFilter(v) {
  return v.id == 30 || v.id == 148;
}

function objectClassesUsr(defaultObjClassUsr) {
  return (user, groups) => {
    if (groups[user.id] && groups[user.id].includes("Next Cloud User"))
      return [defaultObjClassUsr, "nextCloudUser"];
    else return [defaultObjClassUsr];
  };
}

exports.getSiteTransforms = (siteconfig) => {
  var sitetransform = {};
  sitetransform.compatDn = this.lowercase;
  sitetransform.compatEmail = this.lowercase;
  sitetransform.uniqueEmails = this.uniqueEmails
  sitetransform.setObjClassUsr = objectClassesUsr(siteconfig.objclassUsr);
  sitetransform.userDn = (cn) =>
    ldapEsc.dn(["cn=", cn, ",ou=", siteconfig.userskey, ",o=", siteconfig.sitename,
    ]);
  sitetransform.groupDn = (cn) =>
    ldapEsc.dn([
      "cn=",
      cn,
      ",ou=",
      siteconfig.groupkey,
      ",o=",
      siteconfig.sitename,
    ]);

  return sitetransform;
};


exports.getRootObj = (dn, admin, o) => {
  return {
    dn: dn,
    attributes: {
      creatorsname: admin,
      entrydn: dn,
      entryuuid: transform.generateUUID(),
      o: o,
      objectclass: ["top", "organization"],
      structuralobjectclass: "organization",
      subschemasubentry: "cn=Subschema",
    },
  };
}

exports.transformUser = (ctUsr, ctUsrGroups, sitetransform) => {
  result = {};
  if (!ctUsr) throw new DataFormatError("Empty user object");
  var cn = ctUsr.cmsuserid;
  result = {
    dn: sitetransform.compat(sitetransform.userDn(cn)),
    attributes: {
      cn: cn,
      id: ctUsr.id,
      displayname: ctUsr.firstName + " " + ctUsr.lastName,
      uid: this.stringConvLowercaseUmlaut(ctUsr.firstName + "." + ctUsr.lastName),
      entryUUID: ctUsr.guid,
      bbbrole: cn === "aröhm" ? "admin" : "user",
      givenname: ctUsr.firstName,
      street: ctUsr.lastName,
      telephoneMobile: ctUsr.mobile,
      telephoneHome: ctUsr.phonePrivate,
      postalCode: ctUsr.zip,
      l: ctUsr.city,
      sn: ctUsr.lastName,
      email: sitetransform.compatEmail(ctUsr.email),
      mail: sitetransform.compatEmail(ctUsr.email),
      objectclass: sitetransform.setObjClassUsr(ctUsr, ctUsrGroups),
      memberof: (ctUsrGroups[ctUsr.id] || [])
        .filter(groupFilter)
        .map(function (cn) {
          return sitetransform.compat(sitetransform.groupDn({ cn: cn }));
        }),
    },
  };
  return result;
};
