#!/usr/bin/env node
/*
 * Finds what still breaks the language switch and the dark/light switch.
 *
 *   npm run check:i18n-theme                       summary for all of src/
 *   npm run check:i18n-theme -- src/features/notes every finding in that folder/file
 *   npm run check:i18n-theme -- --strict <paths>   exit 1 if anything is found
 *   npm run check:i18n-theme -- --content          also scan medical/legal data files
 *
 * Kinds of finding:
 *   hebrew  Hebrew text in code that does not go through t()  (src/i18n is exempt)
 *   theme   a fixed neutral Tailwind colour (text-white, bg-gray-100, bg-emt-dark…)
 *           with no dark: twin for the same property on that line – use a token
 *           (bg-surface, text-fg, border-line…) instead
 *   inline  a near-white / near-black colour in an inline style or SVG attribute
 *           – use rgb(var(--fg) / 0.3) etc.
 *   dupkey  the same dictionary key in two src/i18n files
 *
 * Escape hatches, on the same line or a comment line right above it
 * (keep them rare, say why):
 *   // i18n-ok: <reason>    e.g. a language's own name, text meant for the patient
 *   // theme-ok: <reason>   e.g. white text on a photo, the CPR screen that is always dark
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const withContent = args.includes('--content');
const targets = args.filter((a) => !a.startsWith('--'));
const verbose = targets.length > 0 || args.includes('--verbose');

const CONTENT_FILES = [/^src\/features\/hub\/data\//, /^src\/features\/legal\/legalContent\.ts$/];
const SKIP = [/^src\/i18n\//, /\.d\.ts$/, /^src\/sw\.ts$/];

const toPosix = (p) => p.split(sep).join('/');

function walk(p, out) {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const name of readdirSync(p)) walk(join(p, name), out);
  } else if (/\.(tsx?|jsx?)$/.test(p)) {
    out.push(p);
  }
  return out;
}

/** Blank out comments but keep line numbers and markers' lines intact. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
}

const HEBREW = /[֐-׿]/;

const NEUTRAL = '(?:white|black|(?:gray|slate|zinc|neutral|stone)-\\d{2,3}|emt-(?:dark|gray|light|muted|border))';
const PROP = '(bg|text|border(?:-[trblxyse])?|divide|ring|placeholder|from|via|to|fill|stroke|outline|decoration)';
const CLASS_RE = new RegExp(`(?<![\\w-])((?:[a-z0-9-]+:)*)${PROP}-${NEUTRAL}(?:\\/(?:\\d+|\\[[^\\]]+\\]))?(?![\\w-])`, 'g');
// Saturated backgrounds: white text on these reads fine in both modes.
const ACCENT_BG = /(?<![\w-])(?:[a-z-]+:)*bg-(?:red|rose|pink|fuchsia|purple|violet|indigo|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|emt-red|emt-green|emt-yellow|emt-blue)(?:-[5-9]00)?(?:\/(?:[6-9]\d|100))?(?![\w-])|bg-gradient-|bg-\[#/;

const COLOR_CONTEXT = /\b(?:color|background|backgroundColor|border\w*|fill|stroke|boxShadow|textShadow|shadow|outline\w*|stopColor)\b/i;
const HEX_RE = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?\b/g;
const RGB_RE = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g;
const NAMED_RE = /['"](white|black)['"]/g;

function isExtreme(r, g, b) {
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.13 || lum > 0.9;
}

function scanFile(abs) {
  const rel = toPosix(relative(ROOT, abs));
  const raw = readFileSync(abs, 'utf8');
  const rawLines = raw.split('\n');
  const lines = stripComments(raw).split('\n');
  const findings = [];
  const isContent = CONTENT_FILES.some((r) => r.test(rel));

  lines.forEach((line, i) => {
    // A marker counts on the same line, or on a comment-only line right above.
    const above = rawLines[i - 1] ?? '';
    const marker = (rawLines[i] ?? '') + (/^\s*(\/\/|\{?\/\*)/.test(above) ? above : '');
    const n = i + 1;

    if (HEBREW.test(line) && !/i18n-ok/.test(marker)) {
      findings.push({ kind: 'hebrew', line: n, text: marker.trim() });
    }
    if (isContent || /theme-ok/.test(marker)) return;

    for (const m of line.matchAll(CLASS_RE)) {
      const variants = m[1] ?? '';
      const prop = m[2].startsWith('border') ? 'border' : m[2];
      if (variants.includes('dark:')) continue;
      const pairRe = new RegExp(`dark:(?:[a-z0-9-]+:)*${prop}(?:-[trblxyse])?-`);
      if (pairRe.test(line)) continue;
      if ((m[0].endsWith('text-white') || /text-white\/\d+$/.test(m[0])) && ACCENT_BG.test(line)) continue;
      findings.push({ kind: 'theme', line: n, text: m[0] });
    }

    if (COLOR_CONTEXT.test(line) && !line.includes('var(--')) {
      for (const m of line.matchAll(HEX_RE)) {
        let h = m[1];
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        const [r, g, b] = [0, 2, 4].map((o) => parseInt(h.slice(o, o + 2), 16));
        if (isExtreme(r, g, b)) findings.push({ kind: 'inline', line: n, text: m[0] });
      }
      for (const m of line.matchAll(RGB_RE)) {
        if (isExtreme(+m[1], +m[2], +m[3])) findings.push({ kind: 'inline', line: n, text: m[0] + '…)' });
      }
      for (const m of line.matchAll(NAMED_RE)) findings.push({ kind: 'inline', line: n, text: m[0] });
    }
  });
  return { rel, findings };
}

function dictDuplicates() {
  const dir = join(ROOT, 'src/i18n');
  if (!existsSync(dir)) return [];
  const seen = new Map();
  const dups = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.ts') || name === 'index.ts' || name === 'types.ts') continue;
    const src = readFileSync(join(dir, name), 'utf8');
    const heStart = src.indexOf('he: {');
    const enStart = src.indexOf('en: {');
    if (heStart < 0 || enStart < 0) continue;
    const block = src.slice(heStart, enStart);
    for (const m of block.matchAll(/^\s{4}(\w+):/gm)) {
      const key = m[1];
      if (seen.has(key)) dups.push({ kind: 'dupkey', key, files: [seen.get(key), name] });
      else seen.set(key, name);
    }
  }
  return dups;
}

// ---------------------------------------------------------------------------

const roots = targets.length ? targets : ['src'];
let files = [];
for (const t of roots) {
  const abs = join(ROOT, t);
  if (!existsSync(abs)) {
    console.error(`not found: ${t}`);
    process.exit(2);
  }
  walk(abs, files);
}
files = files.filter((f) => {
  const rel = toPosix(relative(ROOT, f));
  if (SKIP.some((r) => r.test(rel))) return false;
  if (!withContent && !targets.length && CONTENT_FILES.some((r) => r.test(rel))) return false;
  return true;
});

const results = files.map(scanFile).filter((r) => r.findings.length);
const totals = { hebrew: 0, theme: 0, inline: 0 };

if (verbose) {
  for (const { rel, findings } of results) {
    console.log(`\n${rel}`);
    for (const f of findings) {
      totals[f.kind]++;
      console.log(`  ${rel}:${f.line}  [${f.kind}]  ${f.text.slice(0, 110)}`);
    }
  }
} else {
  const rows = results
    .map(({ rel, findings }) => {
      const c = { hebrew: 0, theme: 0, inline: 0 };
      for (const f of findings) c[f.kind]++;
      for (const k of Object.keys(c)) totals[k] += c[k];
      return { rel, ...c, sum: c.hebrew + c.theme + c.inline };
    })
    .sort((a, b) => b.sum - a.sum);
  const w = Math.max(10, ...rows.map((r) => r.rel.length));
  console.log(`${'file'.padEnd(w)}  hebrew  theme  inline`);
  for (const r of rows) {
    console.log(`${r.rel.padEnd(w)}  ${String(r.hebrew).padStart(6)}  ${String(r.theme).padStart(5)}  ${String(r.inline).padStart(6)}`);
  }
}

const dups = dictDuplicates();
for (const d of dups) console.log(`[dupkey] "${d.key}" is in both src/i18n/${d.files[0]} and src/i18n/${d.files[1]}`);

const total = totals.hebrew + totals.theme + totals.inline + dups.length;
console.log(
  `\n${results.length} files with findings – hebrew ${totals.hebrew}, theme ${totals.theme}, inline ${totals.inline}, duplicate keys ${dups.length}`,
);
if (strict && total > 0) process.exit(1);
