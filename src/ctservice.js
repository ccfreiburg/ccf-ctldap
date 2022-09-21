const log = require('./logging');
const c = require('./constants');
const t = require('./transform');
const ctconn = require('./ctconnection');

gettehgroups = async (groupIds, site) => {
  var url = site.url + c.API_SLUG + c.GROUPMEMBERS_AP;
  groupIds.forEach((id) => {
    url = url + c.IDS + id;
  });
  return await ctconn.get(url, site);
};
exports.getPersonsInGroups = async (groupIds, site) => {
  const result = await gettehgroups(groupIds, site);
  const personIds = [];
  result.data.forEach((el) => {
    if (!personIds.includes(el.personId)) personIds.push(el.personId);
  });
  return personIds;
};

exports.getGroupMemberships = async (groupIds, site) => {
  const result = await gettehgroups(groupIds, site);
  const members = [];
  result.data.forEach((el) => {
    members.push({
      personId: el.personId,
      groupId: el.groupId,
    });
  });
  return members;
};

exports.getGroups = async (groupIds, site) => {
  var url = site.url + c.API_SLUG + c.GROUPS_AP;
  groupIds.forEach((id) => {
    url = url + c.IDS + id;
  });
  const result = await ctconn.get(url, site);
  const groups = [];
  result.data.forEach((el) => {
    groups.push({
      id: el.id,
      guid: el.guid,
      name: el.name,
    });
  });
  return groups;
};

exports.getUid = (data) => {
  if (data[c.LDAPID_FIELD] && data[c.LDAPID_FIELD].length > 0)
    return data[c.LDAPID_FIELD];
  return t.stringConvLowercaseUmlaut(data.firstName + '.' + data.lastName);
};

exports.getPersonRecordForId = async (id, site) => {
  var url = site.url + c.API_SLUG + c.PERSONS_AP + '/' + id;
  const { data } = await ctconn.get(url, site);
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
    cmsuserid: data.cmsUserId ? data.cmsUserId : this.getUid(data),
    email: data.email,
  };
  person[c.LDAPID_FIELD] = this.getUid(data);
  return person;
};

exports.getChurchToolsData = async (site) => {
  const configGroupIds = site.selectionGroupIds.map((id) => id);
  const ctPersonIds = await this.getPersonsInGroups(configGroupIds, site.site);

  this.tranformedGroups.forEach((element) => {
    if (!configGroupIds.includes(element.gid))
      configGroupIds.push(element.guid);
  });
  const ctGroups = await this.getGroups(configGroupIds, site.site);

  const ctPersons = [];
  for await (const id of ctPersonIds) {
    this.push(await this.getPersonRecordForId(id, site.site));
  }
  const ctGroupMembership = this.getGroupMemberships(configGroupIds, site.site);
  return {
    groups: ctGroups,
    persons: ctPersons,
    memberships: ctGroupMembership,
  };
};
