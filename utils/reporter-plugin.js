// utils/reporter-plugin.js
class PluginReporter {
  constructor() {
    this.total = 0; this.passed = 0; this.failed = 0; this.skipped = 0;
    this.errors = [];
  }

  onTestEnd(test, result) {
    this.total += 1;
    if (result.status === 'passed') this.passed += 1;
    else if (result.status === 'skipped') this.skipped += 1;
    else this.failed += 1;
    if (result.error) this.errors.push({
      title: test.titlePath ? test.titlePath().join(' > ') : test.title,
      message: result.error.message,
    });
  }

  async onEnd(maybeResult) {
    const summary = {
      total: this.total, passed: this.passed, failed: this.failed, skipped: this.skipped,
      status: maybeResult?.status || (this.failed ? 'failed' : 'passed'),
      errors: this.errors.slice(0, 10),
    };
    console.log('[Reporter] Emitting testEnd', summary);

    // NEW: run post-run tasks and await them
    const tasks = Array.isArray(global.__postRunTasks) ? global.__postRunTasks : [];
    console.log(`[Reporter] Running ${tasks.length} post-run task(s)…`);
    await Promise.allSettled(tasks.map(fn => {
      try { return fn(summary); } catch (e) { console.error('post-run task threw:', e); }
    }));
    console.log('[Reporter] All post-run tasks finished');
  }
}
module.exports = PluginReporter;
