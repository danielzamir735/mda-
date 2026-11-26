// House-number lookup through HERE, for addresses the open map has no number for.
// The HERE key stays on the server (Vercel env HERE_API_KEY); the map page only sees the result.
//
// Cost cap. HERE geocoding is free up to 30,000 requests a month and has no spending limit of its own, so this
// function counts every request it sends to HERE in a small Redis counter (Upstash, from Vercel's storage) and
// stops at HERE_MONTHLY_CAP (25,000 by default), below the free amount. Without a working counter it sends
// nothing to HERE at all: the cap must always hold. Answers are kept by Vercel's cache for a day, so a repeated
// address does not reach HERE or the counter again.
const ALLOWED = [
  'https://entrance-finder-ten.vercel.app',
  'https://entrance-finder-v2.vercel.app',
  'http://localhost:4300',
  'http://localhost:4301',
];
const CAP = Number(process.env.HERE_MONTHLY_CAP) > 0 ? Number(process.env.HERE_MONTHLY_CAP) : 25000;

// one more request this month; false when the cap is reached or the counter cannot be reached
async function withinCap() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  const month = 'here-geocode:' + new Date().toISOString().slice(0, 7); // a new count every month
  try {
    const r = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['INCR', month], ['EXPIRE', month, 40 * 24 * 3600]]),
    });
    if (!r.ok) return false;
    const n = Number(((await r.json())[0] || {}).result);
    return Number.isFinite(n) && n <= CAP;
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = process.env.HERE_API_KEY;
  const q = String(req.query.q || '').trim().slice(0, 200);
  if (!key) return res.status(503).json({ found: false, reason: 'no-key' });
  if (q.length < 3) return res.status(400).json({ found: false, reason: 'short' });
  if (!(await withinCap())) return res.status(503).json({ found: false, reason: 'cap' });

  try {
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(q)}&in=countryCode:ISR&lang=he&limit=1&apiKey=${key}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ found: false, reason: `here-${r.status}` });
    const it = ((await r.json()).items || [])[0];
    res.setHeader('Cache-Control', 's-maxage=86400'); // the same address is not asked again for a day
    // only a result for the house itself counts; a street or a city is what the open map already gives
    if (!it || it.resultType !== 'houseNumber') return res.status(200).json({ found: false });
    const a = it.address || {};
    return res.status(200).json({
      found: true,
      lat: it.position.lat, lng: it.position.lng,
      access: (it.access || [])[0] || null,          // the point on the street in front of the house
      interpolated: it.houseNumberType !== 'PA',     // PA: a surveyed address point; otherwise estimated along the street
      houseNumber: a.houseNumber || '', street: a.street || '', city: a.city || '',
    });
  } catch {
    return res.status(502).json({ found: false, reason: 'fetch' });
  }
};
