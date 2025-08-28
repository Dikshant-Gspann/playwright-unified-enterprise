// utils/bootstrap.js
const { setupAll } = require('./plugin-runner');

// 1) a global task queue that plugins can push to
global.__postRunTasks = [];

// 2) Playwright globalSetup
module.exports = async () => {
  await setupAll(); // plugins will register tasks here
};
