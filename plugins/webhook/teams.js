// plugins/webhook/teams.js
const { notify } = require('../../utils/notifier');

module.exports = {
  async setup(opts) {
    // Prefer env var; fall back to config value
    const candidate = (process.env.TEAMS_WEBHOOK_URL || (opts && opts.url) || '').trim();

    // Guard: empty or still a ${PLACEHOLDER}
    if (!candidate || candidate.startsWith('${')) {
      console.log('⚠️ [Teams] No valid webhook URL (empty or placeholder). Skipping.');
      return;
    }

    // Safe log (don’t print the full URL)
    try {
      const u = new URL(candidate);
      console.log(`[Teams] Plugin enabled (host: ${u.host}, path: /${u.pathname.split('/').slice(0,2).join('/')}/…)`);
    } catch {
      console.log('⚠️ [Teams] Invalid webhook URL format. Skipping.');
      return;
    }

    process.on('testEnd', async (summary) => {
      const card = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '0076D7',
        summary: 'Playwright Run',
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
      const { status, text } = await notify(candidate, card);
      console.log(`[Teams] Response: ${status} ${text || ''}`);
    });
  }
};
