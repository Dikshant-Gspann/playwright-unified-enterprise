// utils/reporter-plugin.js
class PluginReporter {
  constructor() {
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.errors = [];
  }

  // Called for each test
  onTestEnd(test, result) {
    this.total += 1;
    const status = result.status; // 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted'
    if (status === 'passed') this.passed += 1;
    else if (status === 'skipped') this.skipped += 1;
    else this.failed += 1;

    if (result.error) {
      this.errors.push({
        title: test.titlePath ? test.titlePath().join(' > ') : test.title,
        message: result.error.message,
      });
    }
  }

  // Reporter v2: onEnd(result)
  async onEnd(maybeResult) {
    const summary = {
      total: this.total,
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      status: maybeResult?.status || (this.failed ? 'failed' : 'passed'),
      errors: this.errors.slice(0, 10), // cap to avoid huge payloads
    };
    console.log('[Reporter] Emitting testEnd', summary);
    process.emit('testEnd', summary);
  }
}

module.exports = PluginReporter;
