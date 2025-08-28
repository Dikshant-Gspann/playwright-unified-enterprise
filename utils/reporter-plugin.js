// utils/reporter-plugin.js
class PluginReporter {
  constructor() {
    this.startedAt = Date.now();
    this.projects = [];
    this.latest = new Map();   // key -> status ('passed'|'failed'|'skipped'|...)
    this.seenFail = new Set(); // to capture first error per test
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
      this.errors.push({
        title: test.titlePath ? test.titlePath().join(' > ') : test.title,
        message: result.error.message
      });
    }
  }

  async onEnd(runResult) {
    const statuses = Array.from(this.latest.values());
    const total   = statuses.length;
    const passed  = statuses.filter(s => s === 'passed').length;
    const failed  = statuses.filter(s => s === 'failed' || s === 'timedOut' || s === 'interrupted').length;
    const skipped = statuses.filter(s => s === 'skipped').length;

    const durMs = Date.now() - this.startedAt;
    const mm = String(Math.floor(durMs / 60000)).padStart(2,'0');
    const ss = String(Math.floor((durMs % 60000) / 1000)).padStart(2,'0');

    const summary = {
      total, passed, failed, skipped,
      attempts: this.attempts,                  // useful for debugging retries
      status: runResult?.status || (failed ? 'failed' : 'passed'),
      duration: `${mm}:${ss}`,
      projects: this.projects,
      errors: this.errors.slice(0, 10)
    };

    console.log('[Reporter] Emitting testEnd', summary);

    const tasks = Array.isArray(global.__postRunTasks) ? global.__postRunTasks : [];
    await Promise.allSettled(tasks.map(fn => { try { return fn(summary); } catch (e) { console.error(e); } }));
  }
}
module.exports = PluginReporter;
