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
};

const IL_BBOX = '34.2,29.4,35.95,33.4';
const hasHebrew = (s: string) => /[֐-׿]/.test(s);
const nn = (s: string) => String(s ?? '').replace(/[\s'"׳״]/g, '');
const toks = (s: string) => String(s || '').replace(/[,.\-"'״׳]/g, ' ').split(/\s+/).filter(Boolean);

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

// the city the user typed counts three times as much as a matching street word; keep the typed house number
function rank(q: string, res: Raw[]): AddressResult[] {
  const qt = toks(q), qNum = qt.find(t => /^\d+[א-ת]?$/.test(t)) || '';
  const seen = new Set<string>();
  return res.filter(r => hasHebrew(r.line1 + r.line2))
    .map(r => {
      const l1 = toks(r.line1), l2 = toks(r.line2); let s = 0;
      for (const t of qt) { if (l1.includes(t)) s += 1; if (l2.includes(t)) s += 3; }
      if (qNum && nn(r.housenumber) === nn(qNum)) s += 1;
      return { r: { ...r, exact: !qNum || nn(r.housenumber) === nn(qNum), qNum }, s };
    })
    .sort((a, b) => b.s - a.s).map(x => x.r)
    .filter(r => { const k = r.line1 + '|' + r.line2; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 6);
}

export async function suggestAddresses(q: string, signal?: AbortSignal): Promise<AddressResult[]> {
  return rank(q, await photon(q, signal).catch(() => []));
}

export async function lookupAddress(q: string): Promise<AddressResult[]> {
  const [a, b] = await Promise.all([nominatim(q).catch(() => []), photon(q).catch(() => [])]);
  return rank(q, [...a, ...b]);
}

// the map page opens straight on this result: no second search there
export function mapLink(base: string, r: AddressResult): string {
  const num = r.housenumber || r.qNum;
  const street = r.street || r.line1.replace(/\s*\d+\s*[א-ת]?$/, '');
  const line1 = num ? `${street} ${num}`.trim() : r.line1;
  const q = r.line2 ? `${line1}, ${r.line2}` : line1;
  return `${base}?embed=1&ll=${r.lat.toFixed(6)},${r.lng.toFixed(6)}&q=${encodeURIComponent(q)}${r.exact ? '' : '&near=1'}`;
}
