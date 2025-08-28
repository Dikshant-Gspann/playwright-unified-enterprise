// utils/notifier.js
async function notify(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text().catch(() => '');
  return { status: res.status, text };
}
module.exports = { notify };
