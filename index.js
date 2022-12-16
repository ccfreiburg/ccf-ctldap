/* eslint global-require: 0, import/no-dynamic-require: 0 */

const fs = require('fs');
const { argv } = require('process');
const pino = require('pino');
const c = require('./src/constants');
const main = require('./src/main');
const ctservice = require('./src/ctservice');
const log = require('./src/logging');
const nc = require('./src/nextcloud');

const testDataPath = './testdata/';

function write(name, data) {
  try {
    fs.writeFileSync(name, data);
  } catch (err) {
    log.error(err);
  }
}

async function snapshot(config) {
  const site = config.sites.ccf;
  const result = await main.snapshot(site);
  write('ctdata.json', JSON.stringify(result.data));
  write('ldap.json', JSON.stringify(result.ldap));
}

let restart = () => {};

let initialized = false;

const startedServer = (ip, port) => {
  log.info(`LDAP listening @ ${ip}:${port}`);
  initialized = true;
};
process.on('uncaughtException', (err) => {
  log.error('whoops! there was an error');
  log.error(err);
  if (initialized && restart) {
    restart(startedServer);
  }
});

(async () => {
  if (process.argv.includes('--configsql')) {
    const vcount = process.argv.indexOf('--configsql');
    if (argv.length < vcount + 2) {
      log.error('Parameters missing --configsql <s01> <ccf> <nextCloudUser>');
      process.exit();
    }
    const set = process.argv[vcount + 1];
    const sitename = process.argv[vcount + 2];
    let objectclass = c.LDAP_OBJCLASS_USER;
    if (process.argv.length > vcount + 2) objectclass = process.argv[vcount + 3];
    const testconfig = require(`${testDataPath}config.json`);
    const data = require(`${testDataPath}ldap.json`);
    log.logger.level = 'silent';
    nc.getNextcloudLdapConfig(testconfig, sitename, set, objectclass);
    nc.getNextcloudMappingTables(data, testconfig.sites[sitename].ldap.dc);
  } else if (process.argv.includes('--testdata')) {
    const testconfig = require(`${testDataPath}config.json`);
    const start = await main.start(
      testconfig,
      async () => require(`${testDataPath}ctdata.json`),
      () => async (user, password) => password === 'alex',
      startedServer,
    );
    restart = start.restart;
  } else if (process.argv.includes('--testsnapshot')) {
    const testconfig = require(`${testDataPath}config.json`);
    snapshot(testconfig);
  } else {
    log.logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
    const config = main.getConfig(c.CONFIG_FILE);
    if (config.server.loglevel) log.logger.level = config.server.loglevel;
    const start = await main.start(
      config,
      ctservice.getChurchToolsData,
      ctservice.authWithChurchTools,
      startedServer,
    );
    restart = start.restart;
    setInterval(() => main.update(start.updaters), config.server.updateinterval * 1000);
  }
})();
