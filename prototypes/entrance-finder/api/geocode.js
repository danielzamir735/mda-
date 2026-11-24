// House-number lookup through HERE, for addresses the open map has no number for.
// The HERE key stays on the server (Vercel env HERE_API_KEY); the map page only sees the result.
const ALLOWED = [
  'https://entrance-finder-ten.vercel.app',
  'https://entrance-finder-v2.vercel.app',
  'http://localhost:4300',
  'http://localhost:4301',
];

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = process.env.HERE_API_KEY;
  const q = String(req.query.q || '').trim().slice(0, 200);
  if (!key) return res.status(503).json({ found: false, reason: 'no-key' });
  if (q.length < 3) return res.status(400).json({ found: false, reason: 'short' });

  try {
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(q)}&in=countryCode:ISR&lang=he&limit=1&apiKey=${key}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ found: false, reason: `here-${r.status}` });
    const it = ((await r.json()).items || [])[0];
    // only a result for the house itself counts; a street or a city is what the open map already gives
    if (!it || it.resultType !== 'houseNumber') return res.status(200).json({ found: false });
    const a = it.address || {};
    res.setHeader('Cache-Control', 's-maxage=86400');
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
