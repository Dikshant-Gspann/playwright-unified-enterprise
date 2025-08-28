// utils/reporter-plugin.js
const { notify } = require('./notifier');

// ---------- helpers ----------
const stripAnsi = s => (s || '').replace(/\u001b\[[0-9;]*m/g, '');
const trunc = (s, m = 900) => (!s ? '' : (s.length <= m ? s : s.slice(0, m - 10) + '…[truncated]'));
const safe = s => trunc(stripAnsi(String(s))).replace(/```/g, 'ʼʼʼ');

// Build a robust Adaptive Card (works in most tenants and the new Teams)
function buildAdaptiveCard(summary) {
  const failed = +summary.failed || 0;
  const passed = +summary.passed || 0;
  const total  = +summary.total  || 0;
  const title  = `${failed ? '❌' : '✅'} Playwright CI — ${passed}/${total} passed`;

  const rows = [
    { title: 'Client',   value: String(process.env.CLIENT || '-') },
    { title: 'Branch',   value: String(process.env.GITHUB_REF_NAME || '-') },
    { title: 'Commit',   value: String((process.env.GITHUB_SHA || '').slice(0,7) || '-') },
    { title: 'Duration', value: String(summary.duration || '-') },
    { title: 'Attempts', value: String(summary.attempts || 0) },
    { title: 'Projects', value: Array.isArray(summary.projects) ? summary.projects.join(', ') : String(summary.projects || '-') }
  ];

  // Per-project facts
  const perProjectFacts = Object.entries(summary.perProject || {}).map(([p, s]) => {
    const badge = s.failed ? '❌' : '✅';
    return { title: p, value: `${badge} ${s.passed}/${s.total} (skip ${s.skipped})` };
  });

  const body = [
    { type: 'TextBlock', text: title, size: 'Large', weight: 'Bolder', wrap: true },
    { type: 'FactSet', facts: rows },
  ];

  if (perProjectFacts.length) {
    body.push({ type: 'TextBlock', text: 'Per-project', weight: 'Bolder', spacing: 'Medium' });
    body.push({ type: 'FactSet', facts: perProjectFacts });
  }

  if (summary.flaky && summary.flaky.length) {
    body.push({ type: 'TextBlock', text: 'Flaky (failed then passed)', weight: 'Bolder', spacing: 'Medium' });
    body.push({
      type: 'TextBlock',
      wrap: true,
      fontType: 'Monospace',
      text: safe(summary.flaky.slice(0, 8).map(x => `• ${x}`).join('\n'))
    });
  }

  if (summary.slowest && summary.slowest.length) {
    const slowLines = summary.slowest.slice(0, 5).map(s => `• ${s.name} (${s.project}) — ${s.ms}ms`).join('\n');
    body.push({ type: 'TextBlock', text: 'Top slow tests', weight: 'Bolder', spacing: 'Medium' });
    body.push({ type: 'TextBlock', wrap: true, fontType: 'Monospace', text: safe(slowLines) });
  }

  if (failed && summary.errors && summary.errors.length) {
    body.push({ type: 'TextBlock', text: 'Top error', weight: 'Bolder', spacing: 'Medium' });
    body.push({ type: 'TextBlock', wrap: true, fontType: 'Monospace', text: safe(summary.errors[0].message || '') });
  }

  const actions = [];
  if (summary.runUrl) actions.push({ type: 'Action.OpenUrl', title: 'Open Workflow Run', url: summary.runUrl });
  if (summary.allureUrl) actions.push({ type: 'Action.OpenUrl', title: 'Open Allure Report', url: summary.allureUrl });

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body,
        actions
      }
    }]
  };
}

// ---------- reporter ----------
class PluginReporter {
  constructor() {
    console.log('[Reporter] Loaded');
    this.startedAt = Date.now();

    // latest status per test@project
    this.latest = new Map();             // key -> status
    this.keyProject = new Map();         // key -> projectName
    this.statusHistory = new Map();      // key -> Set of seen statuses (for flakiness)

    // per-project tallies (computed at end from "latest")
    this.perProject = {};                // { [project]: { total, passed, failed, skipped } }

    // diagnostics
    this.slowest = [];                   // [{ name, project, ms }]
    this.errors = [];                    // [{ title, message }]
    this.seenFail = new Set();           // de-duplicate first error per test
    this.attempts = 0;
    this.projects = [];
  }

  onBegin(config) {
    try { this.projects = (config?.projects || []).map(p => p.name); } catch {}
  }

  onTestEnd(test, result) {
    this.attempts += 1;

    const project = result.projectName || '';
    const name = test.titlePath ? test.titlePath().join(' > ') : test.title;
    const key = `${name}@@${project}`;

    // Track final status (last write wins)
    this.latest.set(key, result.status);
    this.keyProject.set(key, project);

    // Track status history to infer flakiness (passed at least once & failed at least once)
    const set = this.statusHistory.get(key) || new Set();
    set.add(result.status);
    this.statusHistory.set(key, set);

    // top slow
    if (typeof result.duration === 'number') {
      this.slowest.push({ name, project, ms: result.duration });
    }

    // first error for this test
    if (result.status !== 'passed' && !this.seenFail.has(key) && result.error) {
      this.seenFail.add(key);
      this.errors.push({ title: name, message: result.error.message });
    }
  }

  async onEnd(runResult) {
    // normalize counts from final statuses only
    const final = Array.from(this.latest.entries()).map(([key, status]) => {
      const project = this.keyProject.get(key) || '';
      if (!this.perProject[project]) this.perProject[project] = { total: 0, passed: 0, failed: 0, skipped: 0 };
      const p = this.perProject[project];
      p.total += 1;
      if (status === 'passed') p.passed += 1;
      else if (status === 'skipped') p.skipped += 1;
      else p.failed += 1;
      return { key, project, status };
    });

    const totals = final.reduce((acc, { status }) => {
      acc.total += 1;
      if (status === 'passed') acc.passed += 1;
      else if (status === 'skipped') acc.skipped += 1;
      else acc.failed += 1;
      return acc;
    }, { total: 0, passed: 0, failed: 0, skipped: 0 });

    const durMs = Date.now() - this.startedAt;
    const mm = String(Math.floor(durMs / 60000)).padStart(2, '0');
    const ss = String(Math.floor((durMs % 60000) / 1000)).padStart(2, '0');

    // flakiness = same test seen both failing and passing
    const flaky = [];
    for (const [key, set] of this.statusHistory.entries()) {
      if (set.has('passed') && (set.has('failed') || set.has('timedOut') || set.has('interrupted'))) {
        flaky.push(key.split('@@')[0]);
      }
    }

    // sort slowest
    this.slowest.sort((a, b) => b.ms - a.ms);

    const runUrl = (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID)
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null;

    const summary = {
      ...totals,
      attempts: this.attempts,
      status: runResult?.status || (totals.failed ? 'failed' : 'passed'),
      duration: `${mm}:${ss}`,
      projects: this.projects,
      perProject: this.perProject,
      flaky,
      slowest: this.slowest.slice(0, 20),
      errors: this.errors.slice(0, 10),
      runUrl,
      allureUrl: process.env.ALLURE_URL || null
    };

    console.log('[Reporter] Emitting testEnd', summary);

    // call registered plugins (Teams, Email, TestRail, etc.)
    const tasks = Array.isArray(global.__postRunTasks) ? global.__postRunTasks : [];
    console.log(`[Reporter] Running ${tasks.length} post-run task(s)…`);
    await Promise.allSettled(
      tasks.map(fn => { try { return fn(summary); } catch (e) { console.error(e); } })
    );

    // Fallback: post an Adaptive Card directly if no plugin registered
    if ((!tasks || tasks.length === 0) && process.env.TEAMS_WEBHOOK_URL) {
      try {
        console.log('[Reporter] Fallback: posting Adaptive Card to Teams');
        const payload = buildAdaptiveCard(summary);
        const { status, text } = await notify(process.env.TEAMS_WEBHOOK_URL, payload);
        console.log(`[Reporter] Fallback Teams response: ${status} ${text || ''}`);
      } catch (e) {
        console.error('[Reporter] Fallback Teams failed:', e?.message || e);
      }
    }

    console.log('[Reporter] All post-run tasks finished');
  }
}

module.exports = PluginReporter;
