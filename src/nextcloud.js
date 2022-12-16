const c = require('./constants');

exports.getNextcloudMappingTables = (churchToolsData, dc) => {
  let insertSql = `REPLACE INTO \`oc_ldap_group_mapping\` VALUES ('cn=admin,ou=groups,${
    dc
  }', 'admin', 'g0'); REPLACE INTO \`oc_ldap_user_mapping\` VALUES `;
  churchToolsData.users.forEach((user) => {
    insertSql
      += `('${
        user.dn
      }', '${
        user.attributes.uid
      }', '${
        user.attributes.entryUUID
      }'),`;
  });
  insertSql = `${insertSql.slice(0, -1)};`;

  // INSERT INTO `oc_ldap_group_mapping` (`ldap_dn`, `owncloud_name`, `directory_uuid`) VALUES ('cn=admin,ou=groups,dc=ccfreiburg,dc=de', 'admin', 'admingruop0');
  console.log(insertSql);
};

exports.getNextcloudLdapConfig = (config, ncAccessObjClass, externalLdapIp) => {
  const ldapip = externalLdapIp || '127.0.0.1';
  const { port } = config.server;
  const site = config.sites.ccf;
  const Orga = site.ldap.dc;
  const Group = `ou=${c.LDAP_OU_GROUPS},`;
  const Users = `ou=${c.LDAP_OU_USERS},`;
  const ncOC = (ncAccessObjClass && ncAccessObjClass.length > 1 ? ncAccessObjClass : c.LDAP_OBJCLASS_USER);

  const set = 's01';
  function getLdapAppSetting(key, val) {
    return `('user_ldap', '${set}${key}', '${val}'),`;
  }

  settingSql = `REPLACE INTO \`oc_appconfig\` VALUES ${
    getLdapAppSetting(
      'ldap_dn',
      `cn=${site.ldap.admincn},${Orga}`,
    )
  }${getLdapAppSetting('ldap_agent_password', site.ldap.password)
  }${getLdapAppSetting('ldap_host', ldapip)
  }${getLdapAppSetting('ldap_port', port)
  }${getLdapAppSetting('ldap_base', Orga)
  }${getLdapAppSetting('ldap_base_groups', Group + Orga)
  }${getLdapAppSetting('ldap_base_users', Users + Orga)
  }${getLdapAppSetting(
    's01',
    'ldap_userlist_filter',
    `(&(objectclass=${ncOC}))`,
  )
  }${getLdapAppSetting('ldap_display_name', 'displayname')
  }${getLdapAppSetting('ldap_expert_username_attr', 'uid')
  }${getLdapAppSetting('ldap_expert_uuid_group_attr', 'entryUUID')
  }${getLdapAppSetting('ldap_expert_uuid_user_attr', 'entryUUID')
  }${getLdapAppSetting('ldap_configuration_active', '1')
  }${getLdapAppSetting('ldap_group_display_name', 'displayname')
  }${getLdapAppSetting(
    's01',
    'ldap_group_filter',
    `(&(objectclass=${c.LDAP_OBJCLASS_GROUP}))`,
  )
  }${getLdapAppSetting('ldap_group_filter_mode', '1')
  }${getLdapAppSetting(
    's01',
    'ldap_group_member_assoc_attribute',
    'uniqueMember',
  )
  }${getLdapAppSetting(
    's01',
    'ldap_groupfilter_objectclass',
    c.LDAP_OBJCLASS_GROUP,
  )
  }${getLdapAppSetting('ldap_expert_uuid_user_attr', 'entryUUID')
  }${getLdapAppSetting(
    's01',
    'ldap_login_filter',
    `(&(objectclass=${ncOC})(uid=%uid))`,
  )
  }${getLdapAppSetting('ldap_loginfilter_attributes', 'uid')
  }${getLdapAppSetting('ldap_user_filter_mode', '1')
  }${getLdapAppSetting(
    's01',
    'ldap_userfilter_objectclass',
    c.LDAP_OBJCLASS_USER,
  )
  }${getLdapAppSetting('ldap_use_memberof_to_detect_membership', '1')
    // Ab hier muss nicht angepasst werden.
  }('user_ldap',  '${set}has_memberof_filter_support', '1'),('user_ldap',  '${set}home_folder_naming_rule', ''),`
    + `('user_ldap',  '${set}last_jpegPhoto_lookup', '0'),('user_ldap',  '${set}ldap_attributes_for_group_search', ''),`
    + `('user_ldap',  '${set}ldap_attributes_for_user_search', ''),('user_ldap',  '${set}ldap_backup_host', ''),`
    + `('user_ldap',  '${set}ldap_backup_port', ''),('user_ldap',  '${set}ldap_cache_ttl', '600'),`
    + `('user_ldap',  '${set}ldap_default_ppolicy_dn', ''),('user_ldap',  '${set}ldap_dynamic_group_member_url', ''),`
    + `('user_ldap',  '${set}ldap_email_attr', 'mail'),('user_ldap',  '${set}ldap_experienced_admin', '0'),`
    + `('user_ldap',  '${set}ldap_ext_storage_home_attribute', ''),('user_ldap',  '${set}ldap_gid_number', 'gidNumber'),`
    + `('user_ldap',  '${set}ldap_groupfilter_groups', ''),('user_ldap',  '${set}ldap_login_filter_mode', '0'),`
    + `('user_ldap',  '${set}ldap_loginfilter_email', '0'),('user_ldap',  '${set}ldap_loginfilter_username', '1'),`
    + `('user_ldap',  '${set}ldap_nested_groups', '0'),('user_ldap',  '${set}ldap_override_main_server', ''),`
    + `('user_ldap',  '${set}ldap_paging_size', '500'),`
    + `('user_ldap',  '${set}ldap_quota_attr', ''),('user_ldap',  '${set}ldap_quota_def', ''),`
    + `('user_ldap',  '${set}ldap_tls', '0'),('user_ldap',  '${set}ldap_turn_off_cert_check', '0'),`
    + `('user_ldap',  '${set}ldap_turn_on_pwd_change', '0'),('user_ldap',  '${set}ldap_user_avatar_rule', 'default'),`
    + `('user_ldap',  '${set}ldap_user_display_name_2', ''),('user_ldap',  '${set}ldap_userfilter_groups', '');`;

  console.log(settingSql);
};
