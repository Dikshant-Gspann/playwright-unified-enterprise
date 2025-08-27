const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const { loadConfig } = require('../../utils/loader');

module.exports = {
  async setup(enabled) {
    if (!enabled) return;

    const tplPath = path.join(__dirname, '../../templates/azure-pipelines.yml');
    const outPath = path.join(process.cwd(), 'azure-pipelines.yml');

    let yaml = readFileSync(tplPath, 'utf8');
    const cfg = loadConfig();
    yaml = yaml.replace(/<CLIENT_NAME>/g, cfg.client);

    writeFileSync(outPath, yaml, 'utf8');
    console.log(`   → Generated azure-pipelines.yml for client: ${cfg.client}`);
  }
};
