// utils/reporter-plugin.js
class PluginReporter {
  async onEnd(config, result) {
    const summary = {
      total:  result.numTotalTests,
      passed: result.numPassedTests,
      failed: result.numFailedTests,
      errors: result.errors,
    };
    console.log('[Reporter] Emitting testEnd', summary);
    process.emit('testEnd', summary);
  }
}
module.exports = PluginReporter;
