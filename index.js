const c = require('./src/constants');
const main = require('./src/main');
const ctservice = require('./src/ctservice');
const log = require('./src/logging');
const nc = require('./src/nextcloud');
const fs = require('fs');
const { argv } = require('process');
const pino = require('pino')
const pretty = require('pino-pretty')

function write(name, data) {
  try {
    fs.writeFileSync(name, data);
  } catch (err) {
    console.error(err);
  }
}

async function sanpshot() {
  const conf = require('./production/config.json');
  const site = conf.sites.ccf;
  const result = await main.snapshot(site);
  write('ctdata.json', JSON.stringify(result.data));
  write('ldap.json', JSON.stringify(result.ldap));
}

var restart = () => {};

var initialized = false;

startedServer = (ip,port) => {
  log.info('LDAP listening @ ' + ip + ":"+ port);
  initialized = true;
};
process.on('uncaughtException', (err) => {
  log.error('whoops! there was an error');
  log.error(err);
  if (initialized && restart) {
    restart(startedServer);
  }
});

exports.getTestConfig = () => {
    return require('./production/config.json');
}

run = async () => {
  if (process.argv.includes('--configsql')) {
    var vcount = process.argv.indexOf('--configsql')
    if (argv.length < vcount+2) {
        log.error("Parameters missing --configsql <s01> <ccf> <nextCloudUser>")
        process.exit()
    }        
    var set = process.argv[vcount+1]
    var sitename = process.argv[vcount+2]
    var objectclass = c.LDAP_OBJCLASS_USER
    if (process.argv.length > vcount + 2)
        objectclass = process.argv[vcount+3]
    const data = require('./production/ldap.json');
    log.logger.level = 'silent';
    const testconfig = this.getTestConfig()
    nc.getNextcloudLdapConfig(testconfig, sitename, set, objectclass);
    nc.getNextcloudMappingTables(data, testconfig.sites[sitename].ldap.dc);
  } else if (process.argv.includes('--testdata')) {
    const testconfig = this.getTestConfig()
    const start = await main.start(
      testconfig,
      async () => require('./production/ctdata.json'),
      (site) => async (user, password) => password === 'alex',
      startedServer
    );
    restart = start.restart
  } else if (process.argv.includes('--testsnapshot')) {
    sanpshot();
  } else {
    log.logger = pino({ level: 'info', transport: { target: 'pino-pretty' } })
    const config = main.getConfig(c.CONFIG_FILE)
    start = await main.start(
      config,
      ctservice.getChurchToolsData,
      ctservice.authWithChurchTools,
      startedServer
    );
    restart = start.restart
    setInterval(() => main.update(start.updaters), config.server.updateinterval*1000)
  }
};

run();
