const log = require('./logging');
const c = require('./constants');
const t = require('./transform');
const ctconn = require('./ctconnection');

getGroupsPromiseReal = async (groupIds, ap, site) => {
  var url = site.url + c.API_SLUG + ap;
  var first = !url.includes("?");
  groupIds.forEach((id) => {
    if (first) {
      url = url + "?" + c.IDS.substring(1) + id
      first = false
    } else
      url = url + c.IDS + id;
  });
  return await ctconn.get(url, site);
};
var getGroupsPromise = getGroupsPromiseReal
exports.mockGetGroups= (mock) => getGroupsPromise=mock;

exports.getPersonsInGroups = async (groupIds, site) => {
  const result = await getGroupsPromise(groupIds, c.GROUPMEMBERS_AP, site);
  const personIds = [];
  result.data.forEach((el) => {
    if (!personIds.includes(el.personId)) personIds.push(el.personId);
  });
  return personIds;
};

exports.getGroupMemberships = async (groupIds, site) => {
  const result = await getGroupsPromise(groupIds, c.GROUPMEMBERS_AP,  site);
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
  const result = await getGroupsPromise(groupIds, c.GROUPS_AP,  site);
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

getPersonRecord = (data) => {
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
    cmsuserid: (data.cmsUserId ? data.cmsUserId : ""),
    email: data.email,   
  };
  if (data[c.LDAPID_FIELD] && data[c.LDAPID_FIELD].length > 0)
    person[c.LDAPID_FIELD] = data[c.LDAPID_FIELD]
  return person;
}

exports.getPersonRecordForId = async (id, site) => {
  var url = site.url + c.API_SLUG + c.PERSONS_AP + '/' + id;
  const { data } = await ctconn.get(url, site);
  return getPersonRecord(data);
};

exports.getPersonsForIds = async (ids, site) => {
  const persons= []
  const clonedIds = [...ids];
  const chunkedIds = [];
  const chunkSize = clonedIds.length/10;
  for(var i=0; i<chunkSize; i++) {
    chunkedIds.push(clonedIds.splice(0, 10));
  }
  for await ( idarray of chunkedIds ) {
    const result = await getGroupsPromise(idarray, c.PERSONS_AP,  site);
    result.data.forEach( (person) => {
      persons.push(getPersonRecord(person))
    })
  }
  return persons
}

exports.authWithChurchTools = (site) => {
  return ( user, password ) => ctconn.authenticate(site.site.url, user, password)
}


exports.getChurchToolsData = async (selectionGroupIds, tranformedGroups, site) => {

  const allGoupsIds = selectionGroupIds.map((id) => id);
  tranformedGroups.forEach((element) => {
  if (!allGoupsIds.includes(element.gid))
      allGoupsIds.push(element.gid);
  });
  
  log.info("Get Persons from ChurchTools")
  const ctPersonIds = await this.getPersonsInGroups(selectionGroupIds, site);
  log.info("Get Groups from ChurchTools")
  const ctGroups = await this.getGroups(allGoupsIds, site);
  log.info("Get Person Details from ChurchTools")
  const ctPersons = await this.getPersonsForIds(ctPersonIds, site);
  log.info("Get Group Memberships from ChurchTools")
  const ctGroupMembership = await this.getGroupMemberships(allGoupsIds, site);

  return {
     groups: ctGroups,
     persons: ctPersons,
     memberships: ctGroupMembership,
  };
};
