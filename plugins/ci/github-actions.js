// plugins/ci/github-actions.js
module.exports = {
  /**
   * @param {boolean} enabled
   */
  async setup(enabled) {
    if (!enabled) return;
    console.log('✅ [CI] GitHub Actions plugin enabled');
    // TODO: copy .github/workflows/ci.yml
  }
};
