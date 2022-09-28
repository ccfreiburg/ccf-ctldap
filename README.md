# ctcaldap
 .. is a Church Tools Ldap Proxy and using many ideas and loc from the  https://github.com/milux/ctldap.git repository. Goal of the effort was to 
   - refactor code so it is
     - it is unit testable
     - it is mockable
     - offers better adaptability 
   - support migrations from existing IDM (in case of Calvary Chapel Freiburg a pre-existing LDAP providing user authentication and groups to Nextcloud and Big Blue Button) by offering to
     - filter groups 
     - map groups
     - fill fields depending on groups
   - maybe allow different kinds of caching
  
Like milux/ctladp it is heavily based on ldapjs.

## Installation

You can just use the docker image guxxde/ccf-ctldap. You need to be aware, that in order to run you need to do a lot of configuration in the yaml flile (see config-example.yml) and then mount a volume containing the config.yml to /ldap/config in the container. 

Node.js is required to run this software. http://nodejs.org/

Get and install node, clone the repo and run `npm install` (`yarn`) to install dependancies. After that you can run the tests by `npm run test` (`yarn test`) or the cli by `node . `

## not implemented
cmsuserid
Grouptype 
lowercase settings
  dn_lower_case immer true // site.dn_lower_case || ((site.dn_lower_case === undefined) && config.dn_lower_case)
  email_lower_case immer true, // || ((site.email_lower_case === undefined) && config.email_lower_case)
?
  emails_unique: false, //|| ((site.emails_unique === undefined) && config.emails_unique)

