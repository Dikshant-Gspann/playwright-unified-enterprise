// plugins/ci/circleci.js
module.exports = {
  /**
   * @param {boolean} enabled
   */
  async setup(enabled) {
    if (!enabled) return;
    console.log('✅ [CI] CircleCI plugin enabled');
    // TODO: copy .circleci/config.yml
  }
};
