const { readFileSync } = require('fs');

function interpolateEnv(obj) {
  if (obj == null) return obj;
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([\w\d_]+)\}/g, (_, k) => process.env[k] ?? '');
  }
  if (Array.isArray(obj)) return obj.map(interpolateEnv);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = interpolateEnv(v);
    return out;
  }
  return obj;
}

function loadConfig() {
  const client = process.env.CLIENT || 'LondonDrugs';
  const raw = JSON.parse(readFileSync(`configs/${client}.json`, 'utf8'));
  return interpolateEnv(raw); // <-- important
}

module.exports = { loadConfig };
