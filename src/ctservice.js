const log = require("./logging");
const c = require("./constants");
const t = require("./transform");
const ctconn = require("./ctconnection");

exports.getPersonsInGroups = async (groupIds, site) => {
  var url = site.url + c.API_SLUG + c.GROUPMEMBERS_AP
  groupIds.forEach(id => {
    url = url + c.IDS + id
  });
  const result = await ctconn.get(url, site)
  const personIds = []
  result.data.forEach((el) => {
    if (!personIds.includes(el.personId))
      personIds.push(el.personId)
  })
  return personIds
}

exports.getUid = (data) => {
  if (data[c.LDAPID_FIELD] && data[c.LDAPID_FIELD].length > 0)
    return data[c.LDAPID_FIELD];
  return t.stringConvLowercaseUmlaut(data.firstName + "." + data.lastName)
}

exports.getPersonRecordForId = async (id, site) => {
  var url = site.url + c.API_SLUG + c.PERSONS_AP + "/" + id;
  const { data } = await ctconn.get(url, site)
  var person = {
    id: data.id,
    guid: data.guid,
    firstName: data.firstName,
    lastName: data.lastName,
    nickname: data.nickname,
    street: data.street,
    mobile: data.mobile,
    phonePrivate: data.phonePrivate,
    zip: data.zip,
    city: data.city,
    cmsuserid: (data.cmsUserId ? data.cmsUserId : this.getUid(data)),
    email: data.email,
  }
  person[c.LDAPID_FIELD] = this.getUid(data)
  return person
}