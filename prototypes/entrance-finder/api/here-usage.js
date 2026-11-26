// How many requests the map sent to HERE this month, against the cap and HERE's free amount.
// Only these numbers: no key, no addresses. The daily check reads it and warns well before any charge.
const FREE = 30000;

module.exports = async function handler(req, res) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const cap = Number(process.env.HERE_MONTHLY_CAP) > 0 ? Number(process.env.HERE_MONTHLY_CAP) : 25000;
  const month = new Date().toISOString().slice(0, 7);
  res.setHeader('Cache-Control', 'no-store');
  if (!url || !token) return res.status(503).json({ month, error: 'no-counter' });
  try {
    const r = await fetch(`${url}/get/${encodeURIComponent('here-geocode:' + month)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return res.status(502).json({ month, error: `counter-${r.status}` });
    const used = Number((await r.json()).result) || 0;
    return res.status(200).json({ month, used, cap, free: FREE, percentOfFree: Math.round((used / FREE) * 1000) / 10 });
  } catch {
    return res.status(502).json({ month, error: 'counter-fetch' });
  }
};
