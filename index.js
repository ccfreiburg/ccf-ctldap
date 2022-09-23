const c = require('./src/constants')
const YAML = require('yamljs')
const main = require("./src/main")


main.start(
    require("./production/config.json"),
    async () => require("./production/ctdata.json") )


//main.start(YAML.load(c.CONFIG_FILE),ctservice.getChurchToolsData);