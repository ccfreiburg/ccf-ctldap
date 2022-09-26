const c = require('./src/constants')
const YAML = require('yamljs')
const main = require("./src/main")
const log = require('./src/logging')
const nc = require("./src/nextcloud")
const fs = require("fs")

function write(name, data) {
try {
    fs.writeFileSync(name, data);
  } catch (err) {
    console.error(err);
  }
}

async function sanpshot() {
    const conf = require("./production/config.json")
    const site = conf.sites.ccf
    const result = await main.snapshot(site)
    write("ctdata.json", JSON.stringify(result.data));
    write("ldap.json", JSON.stringify(result.ldap));
}

var restart = null
var initialized = false

startedServer = () => {
    console.log("hi")
    log.info('LDAP listening @ ' + ldapjs.url);
    initialized = true
}

testconfig = require("./production/config.json")
testauth = (site) => async (user, password) => password==="alex"
testdata = async () => require("./production/ctdata.json")

if (process.argv.includes("--configsql")) {
    const sitename = "ccf"
    const data = require("./production/ldap.json")
    log.logger.level = 'silent'
    nc.getNextcloudLdapConfig( testconfig.sites[sitename].ldap, "s02", "nextCloudUser")
    nc.getNextcloudMappingTables(data, testconfig.sites[sitename].ldap.dc)
} else if (process.argv.includes("--testdata")) {
    restart = main.start(
        testconfig,
        testdata,
        testauth,
        startedServer )
} else if (process.argv.includes("--testsnapshot")) {
    sanpshot()
} else {
    restart = main.start(YAML.load(c.CONFIG_FILE),ctservice.getChurchToolsData, ctservice.authWithChurchTools(), startedServer);
}

process.on('uncaughtException', (err) => {
    log.error('whoops! there was an error');
    log.error(err);
    if (initialized && restart) 
        restart();
 });
