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

Node.js is required to run this software. http://nodejs.org/

Get and install node, clone the repo and run `npm install` (`yarn`) to install dependancies. After that you can run the tests by `npm run test` (`yarn test`) or the cli by `node . `

