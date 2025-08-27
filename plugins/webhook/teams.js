// plugins/webhook/teams.js
const { notify } = require('../../utils/notifier');
module.exports = {
  /** @param {{url:string}} opts */
  async setup(opts) {
    console.log(`🔔 [Teams] webhook setup: ${opts.url}`);
    process.on('testEnd', (summary) => {
      notify(opts.url, {
        text: `Tests finished: ${summary.passed}/${summary.total} passed`,
      });
    });
  }
};
