// plugins/webhook/teams.js
const { notify } = require('../../utils/notifier');

module.exports = {
  async setup(opts) {
    const url = (process.env.TEAMS_WEBHOOK_URL || (opts && opts.url) || '').trim();
    if (!url || url.startsWith('${')) { console.log('⚠️ [Teams] No valid webhook URL.'); return; }

    // Safe log
    try {
      const u = new URL(url);
      console.log(`[Teams] Plugin enabled (host: ${u.host}, path: /${u.pathname.split('/').slice(0,2).join('/')}/…)`);
    } catch { console.log('⚠️ [Teams] Invalid webhook URL format.'); return; }

    // Helper: GH links if running in Actions
    const repo = process.env.GITHUB_REPOSITORY;
    const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
    const runId = process.env.GITHUB_RUN_ID;
    const runUrl = (repo && runId) ? `${server}/${repo}/actions/runs/${runId}` : null;

    // Register post-run task
    (global.__postRunTasks || (global.__postRunTasks = [])).push(async (s) => {
      const client = process.env.CLIENT || (opts && opts.client) || '';
      const branch = process.env.GITHUB_REF_NAME || '';
      const sha = (process.env.GITHUB_SHA || '').slice(0, 7);
      const actor = process.env.GITHUB_ACTOR || 'CI';
      const projects = (s.projects && s.projects.length) ? s.projects.join(', ') : 'default';
      const color = s.failed ? 'E81123' /* red */ : '2EB886' /* green */;
      const titleEmoji = s.failed ? '❌' : '✅';
      const title = `${titleEmoji} Playwright CI — ${s.passed}/${s.total} passed`;

      const card = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: color,
        summary: 'Playwright Run',
        sections: [
          {
            activityTitle: `**${title}**`,
            activitySubtitle:
              `${client ? `Client: ${client} · ` : ''}${branch || 'unknown'}${sha ? ` · ${sha}` : ''}`,
            markdown: true
          },
          {
            facts: [
              { name: 'Total',    value: String(s.total) },
              { name: 'Passed',   value: String(s.passed) },
              { name: 'Failed',   value: String(s.failed) },
              { name: 'Skipped',  value: String(s.skipped) },
              { name: 'Duration', value: s.duration || '-' },
              { name: 'Projects', value: projects },
              { name: 'Triggered by', value: actor }
            ],
            markdown: true
          },
          ...(s.errors && s.errors.length ? [{
            activityTitle: '**Top error**',
            text: '```' + (s.errors[0].message || '').slice(0, 600) + '```',
            markdown: true
          }] : [])
        ],
        potentialAction: [
          ...(runUrl ? [{
            '@type': 'OpenUri',
            name: 'Open Workflow Run',
            targets: [{ os: 'default', uri: runUrl }]
          }] : []),
          ...(process.env.ALLURE_PUBLIC_URL ? [{
            '@type': 'OpenUri',
            name: 'Open Allure Report',
            targets: [{ os: 'default', uri: process.env.ALLURE_PUBLIC_URL }]
          }] : [])
        ]
      };

      console.log('[Teams] Posting summary card…');
      const { status, text } = await notify(url, card);
      console.log(`[Teams] Response: ${status} ${text || ''}`);
    });
  }
};
