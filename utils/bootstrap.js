// utils/bootstrap.js
const { setupAll } = require('./plugin-runner');
global.__postRunTasks = [];        // <— create the queue first
module.exports = async () => { await setupAll(); };
