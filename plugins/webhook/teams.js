// plugins/webhook/teams.js
const { notify } = require('../../utils/notifier');

// Strip ANSI color codes from Playwright error messages
function stripAnsi(s) {
  return (s || '').replace(/\u001b\[[0-9;]*m/g, '');
}
function truncate(s, max = 900) {
  if (!s) return '';
  return s.length <= max ? s : s.slice(0, max - 10) + '…[truncated]';
}
function codeBlock(s) {
  // Escape accidental ``` in payload that can break Teams renderer
  const safe = truncate(stripAnsi(s)).replace(/```/g, 'ʼʼʼ'); // prime-like char
  return '```\n' + safe + '\n```';
}

module.exports = {
  async setup(opts) {
    const url = (process.env.TEAMS_WEBHOOK_URL || (opts && opts.url) || '').trim();
    if (!url || url.startsWith('${')) {
      console.log('⚠️ [Teams] No valid webhook URL. Skipping.');
      return;
    }

    // Register a post-run task the reporter will call
    (global.__postRunTasks || (global.__postRunTasks = [])).push(async (s) => {
      try {
        const failed = Number(s.failed || 0);
        const passed = Number(s.passed || 0);
        const total  = Number(s.total  || 0);
        const color  = failed > 0 ? 'E81123' : '2EB886';
        const title  = `${failed > 0 ? '❌' : '✅'} Playwright CI — ${passed}/${total} passed`;

        const runUrl = (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID)
          ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
          : null;

        // Build minimal, schema-safe O365 MessageCard
        const card = {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          summary: 'Playwright Run Summary',
          themeColor: color,
          sections: [
            { activityTitle: `**${title}**`, markdown: true },
            {
              facts: [
                { name: 'Client',   value: String(process.env.CLIENT || '-') },
                { name: 'Branch',   value: String(process.env.GITHUB_REF_NAME || '-') },
                { name: 'Commit',   value: String(process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0,7) : '-') },
                { name: 'Duration', value: String(s.duration || '-') },
                { name: 'Total',    value: String(total) },
                { name: 'Passed',   value: String(passed) },
                { name: 'Failed',   value: String(failed) },
                { name: 'Projects', value: Array.isArray(s.projects) ? s.projects.join(', ') : String(s.projects || '-') }
              ],
              markdown: true
            },
            ...(s.errors && s.errors.length
              ? [{
                  activityTitle: '**Top error**',
                  text: codeBlock(s.errors[0].message || ''),
                  markdown: true
                }]
              : [])
          ],
          potentialAction: runUrl ? [{
            '@type': 'OpenUri',
            name: 'Open Workflow Run',
            targets: [{ os: 'default', uri: runUrl }]
          }] : []
        };

        console.log('[Teams] Posting summary card…');
        const { status, text } = await notify(url, card);
        console.log(`[Teams] Response: ${status} ${text || ''}`);
      } catch (e) {
        console.error('[Teams] Failed to post card:', e?.message || e);
      }
    });
  }
};
