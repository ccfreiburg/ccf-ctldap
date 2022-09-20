var ldapEsc = require("ldap-escape");

class DataFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataFormatError";
  }
}
exports.lowercase = (s) => (typeof s === "string" ? s.toLowerCase() : s);
exports.identity = (s) => s;
exports.getCompatStringFunc = (isLowercase) =>
  isLowercase ? this.lowercase : this.identity;
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
  sitetransform.compat = this.getCompatStringFunc(siteconfig.dn_lower_case);
  sitetransform.userDn = (cn) =>
    ldapEsc.dn([
      "cn=",
      cn,
      ",ou=",
      siteconfig.userskey,
      ",o=",
      siteconfig.sitename,
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
  sitetransform.compatEmail = this.getCompatStringFunc(
    siteconfig.email_lower_case
  );
  sitetransform.uniqueEmails = siteconfig.emails_unique
    ? this.uniqueEmails
    : this.identity;
  sitetransform.setObjClassUsr = objectClassesUsr(siteconfig.objclassUsr);
  return sitetransform;
};

exports.transformUser = (ctUsr, ctUsrGroups, sitetransform) => {
  result = {};
  if (!ctUsr) throw new DataFormatError("Empty user object");

  var cn = ctUsr.cmsuserid;
  console.log(cn);
  result = {
    dn: sitetransform.compat(sitetransform.userDn(cn)),
    attributes: {
      cn: cn,
      id: ctUsr.id,
      displayname: ctUsr.vorname + " " + ctUsr.name,
      uid: this.stringConvLowercaseUmlaut(ctUsr.vorname + "." + ctUsr.name),
      entryUUID: "u" + ctUsr.id,
      bbbrole: cn === "aröhm" ? "admin" : "user",
      givenname: ctUsr.vorname,
      street: ctUsr.strasse,
      telephoneMobile: ctUsr.telefonhandy,
      telephoneHome: ctUsr.telefonprivat,
      postalCode: ctUsr.plz,
      l: ctUsr.ort,
      sn: ctUsr.name,
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
