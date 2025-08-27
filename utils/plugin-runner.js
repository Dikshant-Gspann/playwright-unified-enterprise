// utils/plugin-runner.ts
import { loadConfig } from './loader';

export async function setupAll() {
  const cfg = loadConfig();

  // CI/CD
  for (const ciKey of Object.keys(cfg.ciCd || {})) {
    if (cfg.ciCd[ciKey]) {
      const plugin = require(`../plugins/ci/${ciKey}.js`);
      await plugin.setup(cfg.ciCd[ciKey]);
    }
  }

  // Webhooks
  if (cfg.webhooks.slack) {
    const plugin = require('../plugins/webhook/slack.js');
    await plugin.setup(cfg.webhooks.slack);
  }
  if (cfg.webhooks?.teams?.url) {
    console.log('[Bootstrap] Loading Teams plugin');
    await require('../plugins/webhook/teams.js').setup(cfg.webhooks.teams);
  }

  // TestRail
  if (cfg.testManagement.testrail) {
    const plugin = require('../plugins/testmgmt/testrail.js');
    await plugin.setup(cfg.testManagement.testrail);
  }

  // Email
  if (cfg.emailReporting.enabled) {
    const plugin = require('../plugins/email/smtp.js');
    await plugin.setup(cfg.emailReporting.smtp);
  }
}
