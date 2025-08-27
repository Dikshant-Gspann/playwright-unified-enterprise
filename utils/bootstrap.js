#!/usr/bin/env node
// Step 1: hook TS loader
require('ts-node').register({
  project: require.resolve('../tsconfig.json'),
});

// Step 2: import and run your TS code
const { setupAll } = require('./plugin-runner');
module.exports = async () => {
  await setupAll();
};
