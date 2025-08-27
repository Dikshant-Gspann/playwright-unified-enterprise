// utils/notifier.js
async function notify(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let text = '';
  try { text = await res.text(); } catch {}
  if (!res.ok) console.error('Notify failed:', res.status, text);
  return { ok: res.ok, status: res.status, text };
}
module.exports = { notify };
