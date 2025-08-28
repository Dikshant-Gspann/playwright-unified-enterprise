// plugins/webhook/teams.js
const { notify } = require('../../utils/notifier');

module.exports = {
  async setup(opts) {
    const url = (process.env.TEAMS_WEBHOOK_URL || (opts && opts.url) || '').trim();
    if (!url || url.startsWith('${')) {
      console.log('⚠️ [Teams] No valid webhook URL. Skipping.');
      return;
    }
    // Log safely
    try {
      const u = new URL(url);
      console.log(`[Teams] Plugin enabled (host: ${u.host}, path: /${u.pathname.split('/').slice(0,2).join('/')}/…)`);
    } catch {
      console.log('⚠️ [Teams] Invalid webhook URL format. Skipping.');
      return;
    }

    // Register a post-run task that reporter will await
    (global.__postRunTasks || (global.__postRunTasks = [])).push(async (summary) => {
      const card = {
        '@type': 'MessageCard', '@context': 'http://schema.org/extensions',
        themeColor: '0076D7', summary: 'Playwright Run',
        sections: [{
          activityTitle: 'Playwright Test Summary',
          facts: [
            { name: 'Total',  value: String(summary.total) },
            { name: 'Passed', value: String(summary.passed) },
            { name: 'Failed', value: String(summary.failed) }
          ],
          markdown: true
        }]
      };
      console.log('[Teams] Posting summary card…');
      const { status, text } = await notify(url, card);
      console.log(`[Teams] Response: ${status} ${text || ''}`);
    });
  }
};
