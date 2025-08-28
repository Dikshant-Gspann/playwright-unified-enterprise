// plugins/webhook/teams.js
const { notify } = require('../../utils/notifier');

// Helpers
const stripAnsi = s => (s || '').replace(/\u001b\[[0-9;]*m/g, '');
const truncate = (s, max = 900) => (!s ? '' : s.length <= max ? s : s.slice(0, max - 10) + '…[truncated]');
const safeText = s => truncate(stripAnsi(String(s))).replace(/```/g, 'ʼʼʼ'); // avoid code-fence breakers

function buildRichCard(summary) {
  const failed = Number(summary.failed || 0);
  const passed = Number(summary.passed || 0);
  const total  = Number(summary.total  || 0);
  const color  = failed > 0 ? 'E81123' : '2EB886';
  const title  = `${failed > 0 ? '❌' : '✅'} Playwright CI — ${passed}/${total} passed`;

  const runUrl = (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID)
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;

  const sections = [
    { activityTitle: `**${title}**`, markdown: true },
    {
      facts: [
        { name: 'Client',   value: String(process.env.CLIENT || '-') },
        { name: 'Branch',   value: String(process.env.GITHUB_REF_NAME || '-') },
        { name: 'Commit',   value: String(process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0,7) : '-') },
        { name: 'Duration', value: String(summary.duration || '-') },
        { name: 'Total',    value: String(total) },
        { name: 'Passed',   value: String(passed) },
        { name: 'Failed',   value: String(failed) },
        { name: 'Projects', value: Array.isArray(summary.projects) ? summary.projects.join(', ') : String(summary.projects || '-') }
      ],
      markdown: true
    }
  ];

  if (summary.errors && summary.errors.length) {
    sections.push({
      activityTitle: '**Top error**',
      text: '```\n' + safeText(summary.errors[0].message || '') + '\n```',
      markdown: true
    });
  }

  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: 'Playwright Run Summary',
    themeColor: color,
    sections,
    potentialAction: runUrl ? [{
      '@type': 'OpenUri',
      name: 'Open Workflow Run',
      targets: [{ os: 'default', uri: runUrl }]
    }] : []
  };
}

function buildMinimalCard(summary) {
  const failed = Number(summary.failed || 0);
  const passed = Number(summary.passed || 0);
  const total  = Number(summary.total  || 0);
  const color  = failed > 0 ? 'E81123' : '2EB886';
  const title  = `${failed > 0 ? '❌' : '✅'} Playwright CI — ${passed}/${total} passed`;

  // No sections, no facts, no actions — plain text only (most compatible)
  const lines = [
    `**${title}**`,
    `Client: ${String(process.env.CLIENT || '-')}`,
    `Branch: ${String(process.env.GITHUB_REF_NAME || '-')}`,
    `Commit: ${String(process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0,7) : '-')}`,
    `Duration: ${String(summary.duration || '-')}`,
    `Projects: ${Array.isArray(summary.projects) ? summary.projects.join(', ') : String(summary.projects || '-')}`
  ];
  if (summary.failed && summary.errors && summary.errors.length) {
    lines.push('\nTop error:\n' + safeText(summary.errors[0].message || ''));
  }

  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: 'Playwright Run Summary',
    themeColor: color,
    text: lines.join('\n')
  };
}

module.exports = {
  async setup(opts) {
    const url = (process.env.TEAMS_WEBHOOK_URL || (opts && opts.url) || '').trim();
    if (!url || url.startsWith('${')) {
      console.log('⚠️ [Teams] No valid webhook URL. Skipping.');
      return;
    }

    // Allow forcing the ultra-compatible card via env
    const forceMinimal = (process.env.TEAMS_CARD_MINIMAL || '').toLowerCase() === 'true';

    (global.__postRunTasks || (global.__postRunTasks = [])).push(async (summary) => {
      const card = forceMinimal ? buildMinimalCard(summary) : buildRichCard(summary);

      console.log(`[Teams] Posting ${forceMinimal ? 'minimal' : 'rich'} summary card…`);
      const { status, text } = await notify(url, card);
      console.log(`[Teams] Response: ${status} ${text || ''}`);

      // If Teams accepted (200) but the message still fails to render in your tenant,
      // try a second time with the minimal card automatically.
      if (!forceMinimal && status === 200) {
        // Optional: uncomment to ALWAYS send a minimal fallback message, too.
        // const fb = await notify(url, buildMinimalCard(summary));
        // console.log(`[Teams] Fallback (minimal) Response: ${fb.status} ${fb.text || ''}`);
      }
    });
  }
};
