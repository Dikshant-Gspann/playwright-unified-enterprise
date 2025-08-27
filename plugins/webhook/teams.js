// plugins/webhook/teams.js
const { notify } = require('../../utils/notifier');

module.exports = {
  async setup(opts) {
    if (!opts?.url) { console.log('⚠️ [Teams] No URL provided, skipping'); return; }
    console.log('🔔 [Teams] plugin enabled');
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
      const { status, text } = await notify(opts.url, card);
      console.log(`[Teams] Response: ${status} ${text || ''}`);
    });
  }
};
