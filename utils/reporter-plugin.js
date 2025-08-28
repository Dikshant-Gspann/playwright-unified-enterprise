// utils/reporter-plugin.js
const { notify } = require('./notifier');

const stripAnsi = s => (s || '').replace(/\u001b\[[0-9;]*m/g, '');
const truncate = (s, m = 900) => (!s ? '' : s.length <= m ? s : s.slice(0, m - 10) + '…[truncated]');
const safe = s => truncate(stripAnsi(String(s))).replace(/```/g, 'ʼʼʼ');

function minimalCard(summary) {
  const failed = Number(summary.failed || 0);
  const passed = Number(summary.passed || 0);
  const total  = Number(summary.total  || 0);
  const color  = failed > 0 ? 'E81123' : '2EB886';
  const title  = `${failed ? '❌' : '✅'} Playwright CI — ${passed}/${total} passed`;

  const lines = [
    `**${title}**`,
    `Client: ${String(process.env.CLIENT || '-')}`,
    `Branch: ${String(process.env.GITHUB_REF_NAME || '-')}`,
    `Commit: ${String(process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0,7) : '-')}`,
    `Duration: ${String(summary.duration || '-')}`,
    `Projects: ${Array.isArray(summary.projects) ? summary.projects.join(', ') : String(summary.projects || '-')}`
  ];
  if (failed && summary.errors && summary.errors.length) {
    lines.push('', 'Top error:', safe(summary.errors[0].message || ''));
  }
  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: 'Playwright Run Summary',
    themeColor: color,
    text: lines.join('\n')
  };
}

class PluginReporter {
  constructor() {
    console.log('[Reporter] Loaded');
    this.startedAt = Date.now();
    this.projects = [];
    this.latest = new Map();
    this.seenFail = new Set();
    this.errors = [];
    this.attempts = 0;
  }

  onBegin(config) {
    try { this.projects = (config?.projects || []).map(p => p.name); } catch {}
  }

  onTestEnd(test, result) {
    this.attempts += 1;
    const key = `${test.titlePath().join(' > ')}@@${result.projectName || ''}`;
    this.latest.set(key, result.status);
    if (result.status !== 'passed' && !this.seenFail.has(key) && result.error) {
      this.seenFail.add(key);
      this.errors.push({ title: test.titlePath ? test.titlePath().join(' > ') : test.title, message: result.error.message });
    }
  }

  async onEnd(runResult) {
    const vals = Array.from(this.latest.values());
    const total   = vals.length;
    const passed  = vals.filter(s => s === 'passed').length;
    const failed  = vals.filter(s => ['failed','timedOut','interrupted'].includes(s)).length;
    const skipped = vals.filter(s => s === 'skipped').length;
    const durMs = Date.now() - this.startedAt;
    const mm = String(Math.floor(durMs/60000)).padStart(2,'0');
    const ss = String(Math.floor((durMs%60000)/1000)).padStart(2,'0');

    const summary = {
      total, passed, failed, skipped,
      attempts: this.attempts,
      status: runResult?.status || (failed ? 'failed' : 'passed'),
      duration: `${mm}:${ss}`,
      projects: this.projects,
      errors: this.errors.slice(0, 10)
    };

    console.log('[Reporter] Emitting testEnd', summary);

    const tasks = Array.isArray(global.__postRunTasks) ? global.__postRunTasks : [];
    console.log(`[Reporter] Running ${tasks.length} post-run task(s)…`);
    await Promise.allSettled(tasks.map(fn => { try { return fn(summary); } catch (e) { console.error(e); } }));

    // Fallback: if no plugin posted, send a minimal card directly via webhook
    if ((!tasks || tasks.length === 0) && process.env.TEAMS_WEBHOOK_URL) {
      try {
        console.log('[Reporter] Fallback: posting minimal Teams card directly');
        const { status, text } = await notify(process.env.TEAMS_WEBHOOK_URL, minimalCard(summary));
        console.log(`[Reporter] Fallback Teams response: ${status} ${text || ''}`);
      } catch (e) {
        console.error('[Reporter] Fallback Teams failed:', e?.message || e);
      }
    }

    console.log('[Reporter] All post-run tasks finished');
  }
}
module.exports = PluginReporter;
