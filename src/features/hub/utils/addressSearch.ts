// Address lookup for "איתור כתובת מהיר": Hebrew-only suggestions while typing (Photon),
// and a fuller lookup (Nominatim + Photon) only when the user presses search,
// because Nominatim's usage policy forbids search-as-you-type.

export type AddressResult = {
  lat: number;
  lng: number;
  line1: string;      // street and number, or a place name
  line2: string;      // city
  street: string;
  housenumber: string;
  exact: boolean;     // false when the user typed a number this result does not carry
  qNum: string;       // the house number the user typed
  src?: 'city';       // from the city's own list of house-number signs
};

const IL_BBOX = '34.2,29.4,35.95,33.4';
const hasHebrew = (s: string) => /[֐-׿]/.test(s);
const nn = (s: string) => String(s ?? '').replace(/[\s'"׳״]/g, '');
// the house number as typed, letter included even when written apart: "49 א", "49א" and "49-א" all give "49א"
// A lone letter right after the number is a house letter when it is one of א-ו, or when more words follow it.
// "5 י" at the end is the first letter of the city being typed (ירושלים), not house 5י.
function typedNum(qt: string[]): string {
  for (let i = 0; i < qt.length; i++) {
    if (/^\d+[א-ת]$/.test(qt[i])) return qt[i];
    if (/^\d+$/.test(qt[i])) {
      const nx = qt[i + 1] || '';
      return /^[א-ו]$/.test(nx) || (/^[א-ת]$/.test(nx) && qt[i + 2]) ? qt[i] + nx : qt[i];
    }
  }
  return '';
}
const NOISE = new Set(['רחוב', 'רח', 'שדרות', 'שד']);
// ת"א is one word (Tel Aviv), not the letters ת and א
const abbr = (s: string) => String(s || '').replace(/(^|\s)ת["״']א(?=\s|,|$)/g, '$1תל אביב').replace(/(^|\s)י["״']ם(?=\s|,|$)/g, '$1ירושלים');
const toks = (s: string) => abbr(s).replace(/[,.\-"'״׳]/g, ' ').split(/\s+/).filter(Boolean);

type Raw = Omit<AddressResult, 'exact' | 'qNum'>;

async function photon(q: string, signal?: AbortSignal): Promise<Raw[]> {
  // lang=default returns the local (Hebrew) names; without it Photon follows the phone's language
  const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=default&bbox=${IL_BBOX}`, { signal });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.features || []).map((f: { geometry: { coordinates: number[] }; properties: Record<string, string> }) => {
    const p = f.properties || {};
    const street = p.street || (p.type === 'street' ? p.name : '');
    const line1 = p.housenumber ? `${street || p.name || ''} ${p.housenumber}`.trim()
      : (p.name && p.name !== street ? p.name + (street ? `, ${street}` : '') : (street || p.name || ''));
    const line2 = p.city || p.town || p.village || p.locality || '';
    return { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], line1: line1 || line2, line2, street, housenumber: p.housenumber || '' };
  });
}

async function nominatim(q: string): Promise<Raw[]> {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=il&accept-language=he&limit=7&q=${encodeURIComponent(q)}`);
  if (!r.ok) return [];
  const j = await r.json();
  return j.map((x: { lat: string; lon: string; name?: string; display_name: string; address?: Record<string, string> }) => {
    const a = x.address || {};
    const street = a.road || a.pedestrian || a.footway || '';
    const line1 = a.house_number ? `${street} ${a.house_number}` : (x.name || street || x.display_name.split(',')[0]);
    return { lat: +x.lat, lng: +x.lon, line1, line2: a.city || a.town || a.village || a.suburb || '', street, housenumber: a.house_number || '' };
  });
}

const near = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.abs(a.lat - b.lat) < 0.0012 && Math.abs(a.lng - b.lng) < 0.0014; // about 130 m

// the city the user typed counts three times as much as a matching street word; keep the typed house number.
// The street must be the one typed, whole: "עזרא" ranks above "אבן עזרא", which only contains it.
function rank(q: string, res: Raw[]): AddressResult[] {
  const qt = toks(q).filter(t => !NOISE.has(t)), qNum = typedNum(qt);
  const last = qt[qt.length - 1] || '';
  const numAt = qt.findIndex(t => /^\d/.test(t));
  const typedStreet = (numAt > 0 ? qt.slice(0, numAt) : numAt < 0 ? qt : []).filter(t => !/\d/.test(t));
  const seen = new Set<string>();
  return res.filter(r => hasHebrew(r.line1 + r.line2))
    .map(r => {
      const l1 = toks(r.line1), l2 = toks(r.line2); let s = 0;
      for (const t of qt) { if (l1.includes(t)) s += 1; if (l2.includes(t)) s += 3; }
      if (qNum && nn(r.housenumber) === nn(qNum)) s += 1;
      if (r.src === 'city') s += 3; // the city's own sign for this number
      // the street as typed: whole (+2), being completed ("עזרא" → "עזרא הסופר", 0), or a different street that only contains the word (-4)
      const st = toks(r.street).filter(t => !/\d/.test(t) && !NOISE.has(t));
      if (st.length && typedStreet.length) {
        if (st.every(t => qt.includes(t))) s += 2;
        else if (!typedStreet.every((t, i) => st[i] === t || (i === typedStreet.length - 1 && (st[i] || '').startsWith(t)))) s -= 4;
      }
      // the city still being typed: "ירו" already points to ירושלים
      if (last && !/\d/.test(last) && !l2.includes(last) && l2.some(t => t.startsWith(last))) s += 2;
      return { r: { ...r, exact: !qNum || nn(r.housenumber) === nn(qNum), qNum }, s };
    })
    .sort((a, b) => b.s - a.s).map(x => x.r)
    .filter((r, _, all) => r.src === 'city' || !all.some(c => c.src === 'city' && nn(c.housenumber) === nn(r.housenumber) && near(c, r)))
    .filter(r => { const k = r.line1 + '|' + r.line2; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 6);
}

// Tel Aviv-Yafo publishes every house-number sign with its street, so there the city's own list is searched directly.
// It knows numbers the open map lacks and writes street names surname first ("שינקין מנחם").
// (Jerusalem's server refuses any query with a street name in it, so Jerusalem is matched on the map, by number.)
const TLV_NUMS = 'https://gisn.tel-aviv.gov.il/arcgis/rest/services/IView2/MapServer/527/query';
const TLV_NAMES = ['תל אביב יפו', 'תל אביב', 'יפו'];
function tlvParts(q: string): { words: string[]; num: string; letter: string } | null {
  const flat = abbr(q).replace(/[,.\-"'״׳]/g, ' ').replace(/\s+/g, ' ').trim();
  // the city written out, or being typed at the end ("תל אב")
  const city = TLV_NAMES.find(n => ` ${flat} `.includes(` ${n} `)) || (/(^|\s)תל\s+אב?$/.test(flat) ? 'תל אב' : null);
  if (!city) return null;
  const qt = toks(flat.replace(city, ' ')).filter(t => !NOISE.has(t));
  const n = typedNum(qt), m = n.match(/^(\d+)([א-ת]?)$/);
  const words = qt.filter(t => !/\d/.test(t) && !(m && m[2] && t === m[2]));
  return m && words.length ? { words, num: m[1], letter: m[2] } : null;
}
async function tlvLookup(q: string, signal?: AbortSignal): Promise<Raw[]> {
  const p = tlvParts(q); if (!p) return [];
  const where = p.words.map(w => `t_rechov LIKE '%${w.replace(/'/g, '')}%'`).join(' AND ') + ` AND ms_bayit=${+p.num}`;
  const url = `${TLV_NUMS}?f=json&outSR=4326&returnGeometry=true&outFields=t_rechov,ms_bayit,knisa&where=${encodeURIComponent(where)}`;
  const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 4000);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const j = await (await fetch(url, { signal: ctrl.signal })).json();
    const seen = new Set<string>();
    return (j.features || []).flatMap((f: { attributes: Record<string, string | number>; geometry?: { x: number; y: number } }) => {
      const a = f.attributes, street = String(a.t_rechov || '').trim(), letter = String(a.knisa || '').trim();
      const hn = `${a.ms_bayit}${letter}`, k = `${street}|${hn}`;
      if (!f.geometry || !street || seen.has(k)) return [];
      seen.add(k);
      return [{ lat: f.geometry.y, lng: f.geometry.x, line1: `${street} ${hn}`, line2: 'תל אביב–יפו', street, housenumber: hn, src: 'city' }];
    });
  } catch { return []; } finally { clearTimeout(tm); }
}

// a city half typed after the number ("עזרא 5 י") confuses the search, so it also runs without that last word;
// the ranking then prefers the city that starts with it
function withoutPartialCity(q: string): string | null {
  const t = toks(q);
  const i = t.findIndex(x => /^\d/.test(x));
  return i >= 0 && t.length > i + 1 && !/\d/.test(t[t.length - 1]) ? t.slice(0, -1).join(' ') : null;
}

export async function suggestAddresses(q: string, signal?: AbortSignal): Promise<AddressResult[]> {
  q = abbr(q); // the searches do not know ת"א or י"ם
  const q2 = withoutPartialCity(q);
  const [a, b, c] = await Promise.all([photon(q, signal).catch(() => []), q2 ? photon(q2, signal).catch(() => []) : [], tlvLookup(q, signal)]);
  return rank(q, [...c, ...a, ...b]);
}

export async function lookupAddress(q: string): Promise<AddressResult[]> {
  q = abbr(q);
  const [a, b, c] = await Promise.all([nominatim(q).catch(() => []), photon(q).catch(() => []), tlvLookup(q)]);
  return rank(q, [...c, ...a, ...b]);
}

// the map page opens straight on this result: no second search there
export function mapLink(base: string, r: AddressResult): string {
  // when the map only knows a nearby number (49 for a typed 49א), ask the map for the typed one
  const num = r.exact ? (r.housenumber || r.qNum) : (r.qNum || r.housenumber);
  const street = r.street || r.line1.replace(/\s*\d+\s*[א-ת]?$/, '');
  const line1 = num ? `${street} ${num}`.trim() : r.line1;
  const q = r.line2 ? `${line1}, ${r.line2}` : line1;
  return `${base}?embed=1&ll=${r.lat.toFixed(6)},${r.lng.toFixed(6)}&q=${encodeURIComponent(q)}${r.exact ? '' : `&near=1&gn=${encodeURIComponent(r.housenumber)}`}`;
}
