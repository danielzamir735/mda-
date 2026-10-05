// מנוע המשחק "ריצת פרוטוקול": לוגיקה + שכבת גרפיקה ב־Three.js.
// נשאר JavaScript רגיל (עם engine.d.ts לצדו) כי הוא הועבר כמות שהוא מאב־הטיפוס.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ASSETS = import.meta.env.BASE_URL + 'protocol-runner/';
const TEMPLATE = `
<div class="pr-stage">
  <canvas class="pr-c"></canvas>

  <div class="pr-hud">
    <div class="pr-hearts"></div>
    <div class="pr-dots"></div>
    <div class="pr-scoreBox"><span class="pr-streak">רצף ×2</span><span class="pr-score">0</span></div>
  </div>

  <div class="pr-card">
    <span class="pr-tag tag">ממצא</span>
    <p class="pr-finding"></p>
    <h2 class="pr-question"></h2>
    <div class="pr-chips"></div>
    <div class="pr-timer"><b class="pr-timerBar"></b></div>
    <div class="pr-hint">הזמן מאט · בחרת נתיב? החלק למעלה כדי לזנק</div>
  </div>

  <button class="pr-mute" aria-label="השתק">🔊</button>

  <div class="pr-title overlay show">
    <div>
      <h1 class="logo">ריצת <span>פרוטוקול</span></h1>
      <p class="sub">סע בנתיב של ההחלטה הנכונה, עד בית החולים.</p>
      <div class="dispatch">
        <h3>קריאה נכנסת</h3>
        <p><b>גבר בן 67 · קוצר נשימה</b><br>יושב על כיסא בסלון, נושם מהר ומתקשה לדבר. אשתו הזעיקה.</p>
      </div>
      <div class="how">
        <div><b>⇆</b>החלק או חצים<br>כדי להחליף נתיב</div>
        <div><b>✚</b>אסוף ציוד<br>רפואי בדרך</div>
        <div><b>?</b>לפני שער הזמן<br>מאט — קרא ובחר</div>
      </div>
      <button class="pr-startBtn btn" disabled>טוען…</button>
    </div>
  </div>

  <div class="pr-sheet overlay">
    <div class="panel">
      <h2 class="pr-sheetTitle">✗ לא לפי הפרוטוקול</h2>
      <div class="row">בחרת: <b class="pr-sheetChose"></b></div>
      <div class="row good">הנתיב הנכון: <b class="pr-sheetRight"></b></div>
      <p class="pr-sheetWhy"></p>
      <button class="pr-sheetBtn btn">הבנתי, ממשיכים</button>
    </div>
  </div>

  <div class="pr-end overlay">
    <div>
      <h2 class="pr-endTitle"></h2>
      <div class="pr-endStars stars"></div>
      <div class="pr-endScore big"></div>
      <div class="pr-endSmall small"></div>
      <ul class="pr-recap"></ul>
      <button class="pr-againBtn btn">שחק שוב</button>
      <div class="src">לפי "גישה למטופל עם קוצר נשימה", אוגדן BLS, אגף רפואה מד"א, ינואר 2016<br>מודל האמבולנס: Kenney Car Kit (CC0) · HDRI: Poly Haven (CC0)</div>
    </div>
  </div>
</div>
`;

export function createProtocolRunner(root) {
  // ═════════ התרחיש: גישה למטופל עם קוצר נשימה (אוגדן BLS, עמ' 35–36) ═════════
  const STEPS = [
    { name: 'חשד להשתנקות מגוף זר?',
      finding: 'קוצר הנשימה החמיר בהדרגה מאתמול. לא אכל בשעות האחרונות, משתעל ומדבר במילים בודדות.',
      q: 'חשד להשתנקות מגוף זר?',
      opts: [{ t: 'לא', ok: true }, { t: 'כן' }],
      ok: 'אין חשד להשתנקות — ממשיכים בפרוטוקול.',
      why: 'אין כאן סיפור של שאיפת גוף זר: ההחמרה הדרגתית, והמטופל משתעל ומדבר. חשד להשתנקות היה מעביר אותך לפרוטוקול השתנקות.' },
    { name: 'חשד לתגובה אלרגית?',
      finding: 'אין גרד, אין פריחה ואין נפיחות בפנים או בשפתיים. לא נחשף לאלרגן ידוע.',
      q: 'חשד לתגובה אלרגית?',
      opts: [{ t: 'לא', ok: true }, { t: 'כן' }],
      ok: 'אין סימני אלרגיה — ממשיכים לגישה הכללית למטופל חולה.',
      why: 'זיהוי תגובה אלרגית לפי הפרוטוקול: הופעה פתאומית, חשיפה אפשרית לאלרגן ותסמינים נלווים כמו גרד, אורטיקריה ואנגיואדמה. אף אחד מהם לא קיים כאן.' },
    { name: 'הושבה ומנוחה',
      finding: 'המטופל חסר מנוחה ומנסה לקום וללכת.',
      q: 'איך מנחים אותו?',
      opts: [{ t: 'ישיבה,\nרגליים למטה', ok: true }, { t: 'שכיבה\nעל הגב' }, { t: 'הליכה\nלאמבולנס' }],
      ok: 'הושב את המטופל במנוחה מלאה, רגליים כלפי מטה, והרגע אותו.',
      why: 'לפי הפרוטוקול: ככל הניתן לסייע למטופל לשבת עם רגליים כלפי מטה, לפעול להרגעתו ולהקפיד על מנוחה מלאה.' },
    { name: 'חמצן וסיוע נשימתי',
      finding: '28 נשימות בדקה, שימוש בשרירי עזר ורטרקציות.',
      q: 'מה הטיפול הנשימתי?',
      opts: [{ t: 'חמצן במסיכה\n10–15 ל׳/דקה', ok: true }, { t: 'הנשמה\nבמפוח' }, { t: 'אין צורך\nבחמצן' }],
      ok: 'מעל 20 נשימות בדקה או מצוקה נשימתית — חמצן במסיכה, 10–15 ליטר לדקה.',
      why: 'חמצן במסיכה בקצב 10–15 ליטר לדקה ניתן לכל מטופל מעל 20 נשימות בדקה או במצוקה נשימתית. הנשמה במפוח מיועדת למטופל שאינו נושם או נושם פחות מ־8 נשימות בדקה.' },
    { name: 'חשד למחלה חסימתית?',
      finding: 'ברקע COPD, מעשן שנים רבות ומשתמש במשאפים. נשמעים צפצופים בנשיפה.',
      q: 'חשד למחלה חסימתית?',
      opts: [{ t: 'כן', ok: true }, { t: 'לא' }],
      ok: 'מחלה חסימתית (אסטמה, COPD, דלקת סימפונות) — שקול סיוע באינהלציה.',
      why: 'אסטמה, COPD ודלקת סימפונות הן מחלות חסימתיות. הרקע, המשאפים והצפצופים בנשיפה מכוונים לכך, ולכן שוקלים סיוע באינהלציה.' },
    { name: 'פינוי',
      finding: 'המטופל יושב, מקבל חמצן ומעט רגוע יותר.',
      q: 'מה השלב הבא?',
      opts: [{ t: 'פינוי דחוף\nוניטור בדרך', ok: true }, { t: 'להמתין במקום\nלשיפור' }, { t: 'להשאיר\nבבית' }],
      ok: 'פינוי דחוף לחבירה או לבית החולים הקרוב, ניטור בדרך ודיווח מקדים.',
      why: 'הפרוטוקול מסתיים בפינוי דחוף לחבירה או לבית החולים הקרוב, המשך ניטור וטיפול במהלך הפינוי ושקילת דיווח מקדים.' },
  ];
  const LANE_COLORS = ['#60A5FA', '#A78BFA', '#F59E0B'];
  const KINDS = ['pill', 'heart', 'kit', 'plaster'], KIND_COLOR = { pill: '#f87171', heart: '#fb7185', kit: '#f4f4f5', plaster: '#f2c9a0' };

  // ═════════ לוגיקת המשחק (לא תלויה בגרפיקה) ═════════
  const W = 420, H = 760, LW = 104, SHOW_Z = 30;
  root.classList.add('pr-root'); root.innerHTML = TEMPLATE;
  const stage = root.querySelector('.pr-stage'), cv = root.querySelector('.pr-c');
  const FONT = getComputedStyle(root).fontFamily || 'sans-serif';
  const $ = id => root.querySelector('.pr-' + id);
  const laneX = l => (l - 1) * LW, rnd = n => Math.floor(Math.random() * n), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let AC = null, muted = false;
  function beep(freq, dur = .08, type = 'sine', vol = .07, when = 0) {
    if (muted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + when;
      o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* אין אודיו — ממשיכים בלי */ }
  }
  $('mute').onclick = () => { muted = !muted; $('mute').textContent = muted ? '🔇' : '🔊'; };

  let gfx = null;
  let dead = false, raf = 0;
  let state = 'title', T = 0, dist = 0, vNow = 0, last = performance.now();
  let lane = 1, px = 0, lean = 0, speed = 8, slow = 0, dash = false;
  let ents = [], shake = 0, flash = null;
  let score = 0, hearts = 3, streak = 0, stepIdx = 0, results = [], pendingNext = null, activeGate = null, cardTimer = 0;

  function reset() {
    lane = 1; px = 0; speed = 8; slow = 0; dash = false; ents = []; shake = 0; flash = null;
    score = 0; hearts = 3; streak = 0; stepIdx = 0; results = []; pendingNext = null; activeGate = null;
    hud(); hideCard();
  }
  function start() {
    if (!gfx || !gfx.loaded) return;
    reset(); state = 'run'; $('title').classList.remove('show'); $('end').classList.remove('show');
    spawnSegment(0); beep(523, .1, 'triangle'); beep(784, .14, 'triangle', .07, .1);
  }
  function makeGate(i, z) {
    const st = STEPS[i], opts = [null, null, null];
    const lanes = st.opts.length === 2 ? shuffle([0, 2]) : shuffle([0, 1, 2]);
    const colors = shuffle(LANE_COLORS.slice());
    st.opts.forEach((o, k) => { opts[lanes[k]] = { label: o.t, ok: !!o.ok, color: colors[k] }; });
    return { type: 'gate', z, i, opts, shown: false, resolved: false, open: -1 };
  }
  function spawnSegment(i) {
    const base = i === 0 ? 16 : 22;
    let l = rnd(3), kind = KINDS[rnd(4)];
    for (let k = 0; k < 6; k++) { if (k === 3) { l = (l + 1 + rnd(2)) % 3; kind = KINDS[(KINDS.indexOf(kind) + 1 + rnd(3)) % 4]; } ents.push({ type: 'orb', kind, lane: l, z: base + k * 3.2 }); }
    ents.push({ type: 'cone', lane: (l + 1 + rnd(2)) % 3, z: base + 12 });
    ents.push(makeGate(i, base + 16 + SHOW_Z)); // השער מתגלה רק אחרי שהדרך התפנתה
    speed = 8 + i * .3;
  }
  function spawnFinish() {
    for (let k = 0; k < 8; k++) ents.push({ type: 'orb', kind: KINDS[k % 4], lane: 1, z: 14 + k * 3.5 });
    ents.push({ type: 'hosp', z: 62 });
    state = 'finish';
  }

  function hud() {
    $('hearts').innerHTML = [0, 1, 2].map(i => `<span class="${i < hearts ? '' : 'lost'}">♥</span>`).join('');
    $('dots').innerHTML = STEPS.map((_, i) => `<i class="${results[i] === true ? 'ok' : results[i] === false ? 'bad' : i === stepIdx && state !== 'title' ? 'cur' : ''}"></i>`).join('');
    $('score').textContent = score;
    const m = Math.min(3, streak); $('streak').textContent = 'רצף ×' + m; $('streak').classList.toggle('on', m >= 2);
  }
  function showCard(g) {
    const st = STEPS[g.i]; activeGate = g; cardTimer = 0;
    $('card').className = 'pr-card show'; $('tag').textContent = `ממצא · שלב ${g.i + 1} מתוך ${STEPS.length}`;
    $('finding').textContent = st.finding; $('question').textContent = st.q;
    $('chips').innerHTML = g.opts.map(o => o ? `<div style="--c:${o.color}">${o.label.replace('\n', ' ')}</div>` : '<div class="blocked">חסום</div>').join('');
    beep(660, .05, 'square', .03);
  }
  function okCard(text) { $('card').className = 'pr-card show ok'; $('tag').textContent = '✓ לפי הפרוטוקול'; $('finding').textContent = text; cardTimer = 2.6; }
  function hideCard() { $('card').className = 'pr-card'; cardTimer = 0; }
  function floater(text, color) { const d = document.createElement('div'); d.className = 'floater'; d.textContent = text; d.style.color = color; stage.appendChild(d); setTimeout(() => d.remove(), 950); }

  function resolveGate(g) {
    const st = STEPS[g.i], cur = clamp(Math.round(px / LW) + 1, 0, 2), opt = g.opts[cur], right = g.opts.find(o => o && o.ok);
    g.resolved = true; activeGate = null; dash = false;
    if (opt && opt.ok) {
      streak++; const gain = 100 * Math.min(3, streak); score += gain; results[g.i] = true; g.open = cur;
      gfx.sparks(cur - 1, 2.2, opt.color, 140, 15); floater('+' + gain, '#22C55E');
      flash = { c: [.13, .77, .37], a: .3 }; okCard(st.ok);
      beep(523, .09, 'triangle'); beep(659, .09, 'triangle', .07, .08); beep(784, .16, 'triangle', .07, .16);
      advance(g.i);
    } else {
      streak = 0; hearts--; results[g.i] = false; shake = 16; flash = { c: [.94, .14, .24], a: .8 };
      gfx.sparks(cur - 1, 1.6, '#EF233C', 70, 11); beep(160, .25, 'sawtooth', .09); beep(110, .3, 'sawtooth', .08, .1);
      hideCard(); state = 'explain'; pendingNext = g.i;
      $('sheetTitle').textContent = opt ? '✗ לא לפי הפרוטוקול' : '✗ לא בחרת נתיב';
      $('sheetChose').textContent = opt ? opt.label.replace('\n', ' ') : 'הנתיב החסום';
      $('sheetRight').textContent = right.label.replace('\n', ' ');
      $('sheetWhy').textContent = st.why; $('sheetBtn').textContent = hearts > 0 ? 'הבנתי, ממשיכים' : 'לסיכום';
      $('sheet').classList.add('show');
    }
    stepIdx = g.i + 1; hud();
  }
  function advance(i) { if (i + 1 < STEPS.length) spawnSegment(i + 1); else spawnFinish(); }
  function closeSheet() {
    if (state !== 'explain') return;
    $('sheet').classList.remove('show');
    if (hearts <= 0) return endGame(false);
    state = 'run'; okCard(STEPS[pendingNext].ok); advance(pendingNext); pendingNext = null;
  }
  function endGame(won) {
    state = 'done'; hideCard();
    const correct = results.filter(r => r === true).length, stars = !won ? 0 : correct === STEPS.length ? 3 : correct >= 4 ? 2 : 1;
    $('endTitle').textContent = won ? 'המטופל הגיע לבית החולים' : 'המטופל מידרדר — ננסה שוב';
    $('endStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('');
    $('endScore').textContent = score;
    $('endSmall').textContent = `${correct} מתוך ${STEPS.length} החלטות לפי הפרוטוקול`;
    $('recap').innerHTML = STEPS.map((s, i) => { const r = results[i];
      return `<li class="${r === true ? 'ok' : r === false ? 'bad' : 'na'}"><b>${r === true ? '✓' : r === false ? '✗' : '·'}</b><span><strong>${s.name}</strong><br>${s.ok}</span></li>`; }).join('');
    $('end').classList.add('show');
    if (won) [523, 659, 784, 1047].forEach((f, k) => beep(f, .2, 'triangle', .07, k * .12));
  }

  function doDash() { if (state === 'run' && activeGate && !dash) { dash = true; beep(990, .12, 'triangle', .05); } }
  function move(d) { if (state !== 'run' && state !== 'finish') return; const n = clamp(lane + d, 0, 2); if (n !== lane) { lane = n; beep(300 + n * 60, .04, 'sine', .04); } }
  const onKey = e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') move(-1);
    else if (e.key === 'ArrowRight' || e.key === 'd') move(1);
    else if (e.key === 'ArrowUp' || e.key === 'w') doDash();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (state === 'run') doDash(); else if (state === 'title') start(); else if (state === 'explain') closeSheet(); else if (state === 'done') start(); }
  };
  window.addEventListener('keydown', onKey);
  let pd = null;
  cv.addEventListener('pointerdown', e => { pd = { x: e.clientX, y: e.clientY }; });
  cv.addEventListener('pointerup', e => {
    if (!pd) return; const dx = e.clientX - pd.x, dy = e.clientY - pd.y, r = cv.getBoundingClientRect(); pd = null;
    if (dy < -30 && Math.abs(dy) > Math.abs(dx)) doDash(); else if (Math.abs(dx) > 24) move(dx > 0 ? 1 : -1); else move(e.clientX > r.left + r.width / 2 ? 1 : -1);
  });
  $('startBtn').onclick = start; $('againBtn').onclick = start; $('sheetBtn').onclick = closeSheet;

  function update(dt) {
    T += dt; vNow = 0;
    const moving = state === 'run' || state === 'title' || state === 'finish';
    if (moving) {
      slow = Math.max(0, slow - dt);
      // אזור החלטה: הדרך ריקה והזמן מאט כדי שאפשר יהיה לקרוא. זינוק מקצר את ההמתנה.
      const k = activeGate ? (dash ? 3 : .5) : slow > 0 ? .55 : 1, v = state === 'title' ? 6 : speed * k;
      vNow = v; dist += v * dt;
      if (state !== 'title') for (const e of ents) e.z -= v * dt;
    }
    px += (laneX(lane) - px) * Math.min(1, dt * 14); lean = (laneX(lane) - px) / LW;

    if (state === 'run' || state === 'finish') {
      for (const e of ents) {
        const near = e.z < .7 && e.z > -.6 && Math.abs(laneX(e.lane) - px) < LW * .45;
        if (e.type === 'orb' && near) { e.dead = true; score += 10; gfx.sparks(e.lane - 1, 1.4, KIND_COLOR[e.kind], 22, 7); beep(880 + rnd(3) * 110, .06, 'triangle', .04); hud(); }
        else if (e.type === 'cone' && near) { e.dead = true; streak = 0; shake = 9; slow = .5; gfx.sparks(e.lane - 1, .8, '#fb923c', 40, 9);
          floater('אאוץ׳!', '#fb923c'); beep(140, .15, 'sawtooth', .07); hud(); }
        else if (e.type === 'gate') {
          if (!e.shown && e.z <= SHOW_Z) { e.shown = true; showCard(e); hud(); }
          if (e.shown && !e.resolved) { $('timerBar').style.width = clamp(e.z / SHOW_Z * 100, 0, 100) + '%'; if (e.z <= .4) { resolveGate(e); break; } }
        }
        else if (e.type === 'hosp' && e.z <= 6) { endGame(true); break; }
      }
      ents = ents.filter(e => !e.dead && e.z > -3);
      if (cardTimer > 0 && (cardTimer -= dt) <= 0 && !activeGate) hideCard();
    }
    shake *= Math.pow(.002, dt); if (flash && (flash.a -= dt * 1.1) <= 0) flash = null;
  }

  // ═════════ שכבת הגרפיקה: Three.js ═════════
  function createGfx(canvas) {
    const LANE = 3.2, ZS = 3, ROAD_HALF = 6, ROAD_LEN = 440, ROAD_Z0 = 30;
    const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
    const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
    const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    let pr = Math.min(devicePixelRatio || 1, 2);
    const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene(), FOG = new THREE.Color(0x0f0a22);
    scene.fog = new THREE.FogExp2(FOG, .0125); scene.background = FOG;
    const camera = new THREE.PerspectiveCamera(70, W / H, .3, 1600);
    camera.position.set(0, 4, 9.2);

    // ── פוסט־פרוססינג ──
    const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .42, .6, 1.05); composer.addPass(bloom);
    const fxPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uBlur: { value: 0 }, uVig: { value: .5 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 0, 0) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uBlur, uVig, uFlash; uniform vec3 uFlashCol; varying vec2 vUv;
        void main(){
          vec2 c = vUv - vec2(.5, .44); float d = length(c * vec2(.75, 1.));
          vec3 col = vec3(0.); float amt = uBlur * smoothstep(.08, .6, d);
          for (int i = 0; i < 10; i++) col += texture2D(tDiffuse, vUv - c * amt * (float(i) / 9.)).rgb;   // radial blur לפי מהירות
          col /= 10.;
          col *= mix(1., smoothstep(.95, .18, d), uVig);                                                    // vignette
          col = mix(col, uFlashCol * 1.4, uFlash * smoothstep(.12, .7, d));                               // הבזק בשוליים
          gl_FragColor = vec4(col, 1.);
        }` });
    composer.addPass(fxPass); composer.addPass(new OutputPass());

    // ── טקסטורות פרוצדורליות ──
    function canvasTex(w, h, draw, srgb = true) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAX_ANISO; return t;
    }
    function tileNoise(size, cells, seed) {            // רעש ערכים שמתחבר לעצמו בקצוות
      const g = new Float32Array(cells * cells); let s = seed; for (let i = 0; i < g.length; i++) { s = (s * 16807) % 2147483647; g[i] = s / 2147483647; }
      const out = new Float32Array(size * size);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const fx = x / size * cells, fy = y / size * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = (x0 + 1) % cells, y1 = (y0 + 1) % cells;
        let tx = fx - x0, ty = fy - y0; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        out[y * size + x] = (g[y0 * cells + x0] * (1 - tx) + g[y0 * cells + x1] * tx) * (1 - ty) + (g[y1 * cells + x0] * (1 - tx) + g[y1 * cells + x1] * tx) * ty;
      }
      return out;
    }
    const roadMap = canvasTex(512, 1024, (c, w, h) => {      // 12 מ' רוחב × 16 מ' אורך
      c.fillStyle = '#1d1f28'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 14000; i++) { c.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.16)'; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      const mx = m => m / 12 * w;
      c.fillStyle = '#dfe3ec'; for (const m of [1.2 + LANE, 1.2 + 2 * LANE]) for (const y of [0, 512]) c.fillRect(mx(m) - 3, y, 6, 200);
      c.fillStyle = '#e7e9f0'; c.fillRect(mx(1.2) - 3, 0, 6, h); c.fillRect(mx(10.8) - 3, 0, 6, h);
    });
    const N = 256, hN = (() => { const a = tileNoise(N, 32, 7), b = tileNoise(N, 64, 13), c = tileNoise(N, 128, 29), o = new Float32Array(N * N); for (let i = 0; i < o.length; i++) o[i] = a[i] * .5 + b[i] * .3 + c[i] * .2; return o; })();
    const roadNormal = canvasTex(N, N, c => {
      const img = c.createImageData(N, N), at = (x, y) => hN[((y + N) % N) * N + ((x + N) % N)];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const dx = (at(x + 1, y) - at(x - 1, y)) * 5, dy = (at(x, y + 1) - at(x, y - 1)) * 5, l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
        img.data[i] = (-dx / l * .5 + .5) * 255; img.data[i + 1] = (-dy / l * .5 + .5) * 255; img.data[i + 2] = (1 / l * .5 + .5) * 255; img.data[i + 3] = 255;
      }
      c.putImageData(img, 0, 0);
    }, false);
    const roadRough = canvasTex(N, N, c => {                 // שלוליות: אזורים חלקים ומבריקים
      const a = tileNoise(N, 5, 3), b = tileNoise(N, 12, 17), img = c.createImageData(N, N);
      for (let i = 0; i < N * N; i++) { const n = a[i] * .62 + b[i] * .38, r = (.13 + .34 * smooth(.4, .6, n)) * 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = r; img.data[i * 4 + 3] = 255; }
      c.putImageData(img, 0, 0);
    }, false);
    roadMap.repeat.set(1, ROAD_LEN / 16); roadNormal.repeat.set(2, ROAD_LEN / 6); roadRough.repeat.set(.5, ROAD_LEN / 24);
    const glowTex = canvasTex(128, 128, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); });
    const hazardTex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#111'; c.fillRect(0, 0, w, h); c.fillStyle = '#facc15'; for (let x = -h; x < w + h; x += 48) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 24, h); c.lineTo(x + 24 + h, 0); c.lineTo(x + h, 0); c.fill(); } });
    function textTex(lines, { w = 512, h = 256, color = '#fff', bg = null, border = null, glow = 0, max = 150, weight = 900 } = {}) {
      return canvasTex(w, h, c => {
        if (bg) { c.fillStyle = bg; c.beginPath(); c.roundRect(4, 4, w - 8, h - 8, 26); c.fill(); }
        if (border) { c.strokeStyle = border; c.lineWidth = 10; c.shadowColor = border; c.shadowBlur = glow; c.beginPath(); c.roundRect(10, 10, w - 20, h - 20, 22); c.stroke(); }
        c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.shadowColor = color; c.shadowBlur = glow;
        let fs = Math.min(max, (h - 50) / lines.length / 1.12);
        for (;;) { c.font = `${weight} ${fs}px ${FONT}`; if (Math.max(...lines.map(l => c.measureText(l).width)) <= w - 60 || fs < 20) break; fs -= 4; }
        lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.12 + fs * .04));
      });
    }

    // ── שמיים ──
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uHor: { value: FOG }, uTop: { value: new THREE.Color(0x04050f) }, uGlow: { value: new THREE.Color(0x7a4cff) } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform vec3 uHor, uTop, uGlow; varying vec3 vDir;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){ vec3 d = normalize(vDir); float h = max(d.y, 0.);
          vec3 col = mix(uHor, uTop, smoothstep(0., .45, h));
          col += uGlow * .07 * pow(max(0., -d.z), 6.) * exp(-h * 9.);
          vec2 sp = vec2(atan(d.x, -d.z), asin(d.y)) * 150.; vec2 cell = floor(sp);
          float st = step(.985, h21(cell)) * smoothstep(.22, 0., length(fract(sp) - .5)) * smoothstep(.08, .3, h);
          col += vec3(st) * (.35 + .8 * h21(cell + 3.));
          gl_FragColor = vec4(col, 1.); }` }));
    sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

    // ── תאורה ──
    scene.add(new THREE.HemisphereLight(0x8e9bff, 0x1a1024, .4));
    const moon = new THREE.DirectionalLight(0xaab6ff, .85); moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 60 });
    moon.shadow.bias = -.0006; moon.shadow.normalBias = .04; scene.add(moon, moon.target);
    const streetL = [new THREE.PointLight(0xffd8a0, 0, 38, 1.7), new THREE.PointLight(0xffd8a0, 0, 38, 1.7)]; scene.add(...streetL);

    // ── כביש וסביבתו ──
    const roadMat = new THREE.MeshStandardMaterial({ map: roadMap, normalMap: roadNormal, normalScale: new THREE.Vector2(.14, .14), roughnessMap: roadRough, roughness: 1, metalness: 0, envMapIntensity: 1.25 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, ROAD_LEN), roadMat);
    road.rotation.x = -Math.PI / 2; road.position.z = ROAD_Z0 - ROAD_LEN / 2; road.receiveShadow = true; scene.add(road);
    const zMid = ROAD_Z0 - ROAD_LEN / 2;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, ROAD_LEN), new THREE.MeshStandardMaterial({ color: 0x0c0d16, roughness: .55, envMapIntensity: .5 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.03, zMid); scene.add(ground);
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x23242f, roughness: .5, envMapIntensity: .8 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8b93a8, roughness: .35, metalness: .9 });
    const neonEdge = new THREE.MeshBasicMaterial({ color: hdr(0xff2848, 2.6), toneMapped: false });
    for (const sd of [-1, 1]) {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(4.2, .2, ROAD_LEN), walkMat); walk.position.set(sd * (ROAD_HALF + 2.1), .1, zMid); walk.receiveShadow = true; scene.add(walk);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(.07, .22, ROAD_LEN), railMat); rail.position.set(sd * (ROAD_HALF + .3), .92, zMid); scene.add(rail);
      const neon = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, ROAD_LEN), neonEdge); neon.position.set(sd * (ROAD_HALF + .3), .38, zMid); scene.add(neon);
    }
    const dummy = new THREE.Object3D();
    function inst(geo, mat, count, shadow = false) { const m = new THREE.InstancedMesh(geo, mat, count); m.frustumCulled = false; m.castShadow = shadow; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; }
    function put(mesh, i, x, y, z, sx = 1, sy = 1, sz = 1) { dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }

    const POST_S = 5, POST_N = 84, posts = inst(new THREE.BoxGeometry(.1, .95, .1), railMat, POST_N * 2);

    // פנסי רחוב
    const LAMP_S = 30, LAMP_N = 13;
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3d4c, roughness: .4, metalness: .8 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.6, 1.6), toneMapped: false });
    const addMat = (color, opacity) => new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: true });
    const lampPole = inst(new THREE.CylinderGeometry(.09, .13, 7.6, 8), poleMat, LAMP_N * 2), lampArm = inst(new THREE.BoxGeometry(2.3, .1, .12), poleMat, LAMP_N * 2);
    const lampBulb = inst(new THREE.BoxGeometry(.95, .1, .36), bulbMat, LAMP_N * 2), lampHalo = inst(new THREE.PlaneGeometry(1, 1), addMat(new THREE.Color(1.3, 1.05, .6), .55), LAMP_N * 2);
    const poolGeo = new THREE.PlaneGeometry(1, 1); poolGeo.rotateX(-Math.PI / 2);
    const lampPool = inst(poolGeo, addMat(new THREE.Color(1, .78, .45), .16), LAMP_N * 2);

    // בניינים — חלונות מצוירים ב־shader, בלי טקסטורה
    const bldMat = new THREE.ShaderMaterial({
      fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      vertexShader: `#include <common>
        #include <fog_pars_vertex>
        attribute float aSeed; varying vec2 vWin; varying float vSeed; varying vec3 vN;
        void main(){
          vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vWin = uv * vec2(abs(normal.x) > .5 ? sc.z : sc.x, sc.y); vSeed = aSeed; vN = normal;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `#include <common>
        #include <fog_pars_fragment>
        varying vec2 vWin; varying float vSeed; varying vec3 vN;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          vec3 base = vec3(.022, .026, .05) * (1. + .5 * fract(vSeed * 7.3)), col = base;
          if (abs(vN.y) < .5) {
            vec2 g = vWin / vec2(2.0, 3.0), id = floor(g), f = fract(g);
            float win = step(.16, f.x) * step(f.x, .84) * step(.22, f.y) * step(f.y, .8) * step(1., id.y);
            float r = h21(id + vSeed * 17.), lit = step(.8 - .14 * fract(vSeed * 3.1), r);
            vec3 wc = mix(vec3(1., .8, .42), vec3(.5, .78, 1.), step(.88, r));
            col = mix(base, vec3(.035, .042, .075), win) + win * lit * wc * (.55 + 1.1 * fract(r * 9.7));
          }
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }` });
    const BLD_S = 18, BLD_N = 24, bldGeo = new THREE.BoxGeometry(1, 1, 1), bldSeed = new THREE.InstancedBufferAttribute(new Float32Array(BLD_N * 2), 1);
    bldSeed.setUsage(THREE.DynamicDrawUsage); bldGeo.setAttribute('aSeed', bldSeed);
    const blds = inst(bldGeo, bldMat, BLD_N * 2);
    const NEON = [0xff2d95, 0x22d3ee, 0xffb020, 0x9d5cff, 0x22ff88].map(c => hdr(c, 2.4));
    const neonBars = inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ toneMapped: false }), BLD_N * 2);
    for (let i = 0; i < BLD_N * 2; i++) neonBars.setColorAt(i, NEON[0]);
    let signTex = [];
    const signs = Array.from({ length: 14 }, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.2), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.9, 1.9, 1.9), side: THREE.DoubleSide })); m.visible = false; scene.add(m); return m; });

    // ── גשם ──
    const RAIN = 900, rainPos = new Float32Array(RAIN * 6), rainSeed = new Float32Array(RAIN * 3);
    for (let i = 0; i < RAIN; i++) { rainSeed[i * 3] = Math.random() * 44 - 22; rainSeed[i * 3 + 1] = Math.random() * 18; rainSeed[i * 3 + 2] = Math.random() * 80 - 68; }
    const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3).setUsage(THREE.DynamicDrawUsage));
    const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xaec2ff, transparent: true, opacity: .32, depthWrite: false })); rain.frustumCulled = false; scene.add(rain);

    // ── ניצוצות ──
    const SP = 520, spPos = new Float32Array(SP * 3).fill(-999), spCol = new Float32Array(SP * 3), spVel = new Float32Array(SP * 3), spLife = new Float32Array(SP); let spNext = 0;
    const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3).setUsage(THREE.DynamicDrawUsage)); spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3).setUsage(THREE.DynamicDrawUsage));
    const sparkPts = new THREE.Points(spGeo, new THREE.PointsMaterial({ size: .24, map: glowTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, sizeAttenuation: true }));
    sparkPts.frustumCulled = false; scene.add(sparkPts);
    const tmpC = new THREE.Color();
    function sparks(laneOff, y, color, n, pow) {
      tmpC.set(color).multiplyScalar(3.4); const x = laneOff * LANE;
      for (let k = 0; k < n; k++) { const i = spNext = (spNext + 1) % SP, a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2, v = pow * (.25 + Math.random() * .75);
        spPos[i * 3] = x + (Math.random() - .5) * 1.6; spPos[i * 3 + 1] = y + (Math.random() - .5) * 1.8; spPos[i * 3 + 2] = -2.6;
        spVel[i * 3] = Math.cos(a) * Math.cos(b) * v; spVel[i * 3 + 1] = Math.sin(b) * v + 3; spVel[i * 3 + 2] = Math.sin(a) * Math.cos(b) * v * .6;
        spCol[i * 3] = tmpC.r; spCol[i * 3 + 1] = tmpC.g; spCol[i * 3 + 2] = tmpC.b; spLife[i] = .5 + Math.random() * .6; }
    }
    const rings = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(.92, 1.06, 56), new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); m.visible = false; m.userData.t = 1; scene.add(m); return m; });
    function ring(x, z, color) { const r = rings.find(r => !r.visible) || rings[0]; r.position.set(x, 2.2, z); r.material.color.set(color).multiplyScalar(2.5); r.userData.t = 0; r.visible = true; }

    // ── האמבולנס ──
    const car = new THREE.Group(), carBody = new THREE.Group(); car.add(carBody); scene.add(car);
    const wheels = [];
    const beaconMat = [new THREE.MeshBasicMaterial({ toneMapped: false }), new THREE.MeshBasicMaterial({ toneMapped: false })];
    const beaconL = [new THREE.PointLight(0xff1830, 0, 30, 1.8), new THREE.PointLight(0x2a6bff, 0, 30, 1.8)];
    const beaconHalo = [new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), addMat(new THREE.Color(1, .1, .15), 1)), new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), addMat(new THREE.Color(.15, .4, 1), 1))];
    [-1, 1].forEach((sd, i) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .16, .34), beaconMat[i]); b.position.set(sd * .42, 2.62, .25); carBody.add(b);
      beaconL[i].position.set(sd * 1.5, 4.2, .4); carBody.add(beaconL[i]); beaconHalo[i].position.set(sd * .42, 2.66, .46); carBody.add(beaconHalo[i]);
    });
    const tailMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, .1, .08), toneMapped: false });
    for (const sd of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(.13, .24, .04), tailMat); t.position.set(sd * .93, 1.3, 2.29); carBody.add(t); }
    const head = new THREE.SpotLight(0xdfe8ff, 170, 80, .5, .8, 1.5); head.position.set(0, 1.25, -2.2); head.target.position.set(0, .2, -34); carBody.add(head, head.target);

    // ── פריטים לאיסוף ──
    const std = (color, emissive, ei = .35, rough = .35) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: ei, roughness: rough, metalness: .05 });
    const mWhite = std(0xf4f4f5, 0xffffff, .28), mRed = std(0xef233c, 0xff1830, .9), mSkin = std(0xf2c9a0, 0xf2a060, .35), mPad = std(0xfdeedd, 0xffe0c0, .4);
    const haloGeo = new THREE.PlaneGeometry(2.6, 2.6);
    function withHalo(g, color) { const h = new THREE.Mesh(haloGeo, addMat(new THREE.Color(color).multiplyScalar(.9), .7)); h.position.z = -.25; const o = new THREE.Group(); o.add(g, h); return o; }
    const PROTO = {};
    { const g = new THREE.Group(), cap = new THREE.Mesh(new THREE.CapsuleGeometry(.27, .62, 6, 16), mWhite), half = new THREE.Mesh(new THREE.CylinderGeometry(.275, .275, .31, 16), mRed), end = new THREE.Mesh(new THREE.SphereGeometry(.275, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mRed);
      half.position.y = .155; end.position.y = .31; g.add(cap, half, end); g.rotation.z = .7; const s = new THREE.Group(); s.add(g); PROTO.pill = withHalo(s, 0xff6070); }
    { const sh = new THREE.Shape(); sh.moveTo(25, 25); sh.bezierCurveTo(25, 25, 20, 0, 0, 0); sh.bezierCurveTo(-30, 0, -30, 35, -30, 35); sh.bezierCurveTo(-30, 55, -10, 77, 25, 95); sh.bezierCurveTo(60, 77, 80, 55, 80, 35); sh.bezierCurveTo(80, 35, 80, 0, 50, 0); sh.bezierCurveTo(35, 0, 25, 25, 25, 25);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 26, bevelEnabled: true, bevelThickness: 7, bevelSize: 6, bevelSegments: 3, curveSegments: 12 }); geo.center(); geo.rotateZ(Math.PI); geo.scale(.0105, .0105, .0105);
      const s = new THREE.Group(); s.add(new THREE.Mesh(geo, mRed)); PROTO.heart = withHalo(s, 0xff2040); }
    { const s = new THREE.Group(), box = new THREE.Mesh(new THREE.BoxGeometry(1, .72, .42), mWhite), c1 = new THREE.Mesh(new THREE.BoxGeometry(.15, .44, .46), mRed), c2 = new THREE.Mesh(new THREE.BoxGeometry(.44, .15, .46), mRed), hd = new THREE.Mesh(new THREE.TorusGeometry(.17, .035, 8, 16, Math.PI), mWhite);
      hd.position.y = .36; s.add(box, c1, c2, hd); PROTO.kit = withHalo(s, 0xffffff); }
    { const g = new THREE.Group(), strip = new THREE.Mesh(new THREE.BoxGeometry(1.25, .36, .09), mSkin), pad = new THREE.Mesh(new THREE.BoxGeometry(.4, .37, .12), mPad); g.add(strip, pad); g.rotation.z = -.5; const s = new THREE.Group(); s.add(g); PROTO.plaster = withHalo(s, 0xffc890); }
    const coneProto = new THREE.Group();
    { const o = std(0xff6a10, 0xff4400, .5, .5), w = std(0xffffff, 0xffffff, .6), body = new THREE.Mesh(new THREE.ConeGeometry(.4, 1.05, 18), o), band = new THREE.Mesh(new THREE.CylinderGeometry(.2, .275, .2, 18), w), base = new THREE.Mesh(new THREE.BoxGeometry(.9, .07, .9), o);
      body.position.y = .56; band.position.y = .55; base.position.y = .035; body.castShadow = true; coneProto.add(body, band, base); }

    // ── שערים ──
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x4a4e60, roughness: .4, metalness: .85 });
    const GH = 4.3, boxG = new THREE.BoxGeometry(1, 1, 1), sheetG = new THREE.PlaneGeometry(LANE - .28, GH - .1), signG = new THREE.PlaneGeometry(LANE - .12, 1.6);
    function buildGate(g) {
      const grp = new THREE.Group(); grp.userData = { lanes: [], tex: [] };
      const beam = new THREE.Mesh(boxG, gantryMat); beam.scale.set(LANE * 3 + 1.4, .22, .22); beam.position.y = GH + 2.05; grp.add(beam);
      for (const sd of [-1, 1]) { const col = new THREE.Mesh(boxG, gantryMat); col.scale.set(.22, GH + 2.1, .22); col.position.set(sd * (LANE * 1.5 + .6), (GH + 2.1) / 2, 0); grp.add(col); }
      g.opts.forEach((o, l) => {
        const x = (l - 1) * LANE, parts = [];
        if (!o) {
          const bar = new THREE.Mesh(boxG, new THREE.MeshStandardMaterial({ map: hazardTex, emissive: 0xfacc15, emissiveMap: hazardTex, emissiveIntensity: .7, roughness: .5 })); bar.scale.set(LANE - .3, .75, .22); bar.position.set(x, 1, 0); grp.add(bar);
          for (const sd of [-1, 1]) { const leg = new THREE.Mesh(boxG, gantryMat); leg.scale.set(.12, 1.3, .12); leg.position.set(x + sd * 1.3, .65, 0); grp.add(leg); }
          const t = textTex(['✕'], { w: 256, h: 128, color: '#ff4757', glow: 22, max: 110 }); grp.userData.tex.push(t);
          const s = new THREE.Mesh(signG, new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6), depthWrite: false })); s.position.set(x, GH + 1.05, .05); grp.add(s);
        } else {
          const neon = new THREE.MeshBasicMaterial({ color: hdr(o.color, 2.3), toneMapped: false });
          for (const sd of [-1, 1]) { const p = new THREE.Mesh(boxG, neon); p.scale.set(.13, GH, .13); p.position.set(x + sd * (LANE / 2 - .1), GH / 2, 0); grp.add(p); parts.push(p); }
          const top = new THREE.Mesh(boxG, neon); top.scale.set(LANE - .07, .13, .13); top.position.set(x, GH, 0); grp.add(top); parts.push(top);
          const sheet = new THREE.Mesh(sheetG, new THREE.MeshBasicMaterial({ color: hdr(o.color, .9), transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false })); sheet.position.set(x, GH / 2, 0); grp.add(sheet); parts.push(sheet);
          const t = textTex(o.label.split('\n'), { color: '#ffffff', bg: 'rgba(8,9,18,.92)', border: o.color, glow: 16, max: 150 }); grp.userData.tex.push(t);
          const sign = new THREE.Mesh(signG, new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, color: new THREE.Color(1.35, 1.35, 1.35) })); sign.position.set(x, GH + 1.05, .05); grp.add(sign);
        }
        grp.userData.lanes.push(parts);
      });
      return grp;
    }
    const tintGeo = new THREE.PlaneGeometry(1, 1); tintGeo.rotateX(-Math.PI / 2); tintGeo.translate(0, 0, -.5);
    const tints = [0, 1, 2].map(l => { const m = new THREE.Mesh(tintGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: .2, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set((l - 1) * LANE, .04, 2); m.visible = false; scene.add(m); return m; });

    // ── בית החולים ──
    const hosp = new THREE.Group(); hosp.visible = false; scene.add(hosp);
    {
      const geo = new THREE.BoxGeometry(1, 1, 1); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array([3.3, 8.1, 5.7]), 1));
      const body = new THREE.InstancedMesh(geo, bldMat, 3); body.frustumCulled = false;
      [[0, 19, -9.5, 28, 38, 17], [-23, 8, -9, 18, 16, 15], [23, 8, -9, 18, 16, 15]].forEach((b, i) => { dummy.position.set(b[0], b[1], b[2]); dummy.scale.set(b[3], b[4], b[5]); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); body.setMatrixAt(i, dummy.matrix); });
      hosp.add(body);
      const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d2b, roughness: .4, metalness: .5 });
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(15, .6, 6.5), dark); canopy.position.set(0, 5.9, 1.8); hosp.add(canopy);
      for (const sd of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.5, 5.6, .5), dark); c.position.set(sd * 6.9, 2.8, 4.6); hosp.add(c); }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.08, .72), toneMapped: false })); door.position.set(0, 2.7, -.94); hosp.add(door);
      const mull = new THREE.Mesh(new THREE.BoxGeometry(.18, 5.4, .1), dark); mull.position.set(0, 2.7, -.9); hosp.add(mull);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(6, 6, .5), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.5, 1.55), toneMapped: false })); plate.position.set(0, 31, -.8); hosp.add(plate);
      const crossMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, .15, .25), toneMapped: false });
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.4, .6), crossMat), c2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.5, .6), crossMat); c1.position.set(0, 31, -.6); c2.position.set(0, 31, -.6); hosp.add(c1, c2);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), addMat(new THREE.Color(1, .82, .5), .5)); glow.position.set(0, 3, 6); hosp.add(glow);
    }

    // ── טעינת נכסים ──
    const api = { loaded: false, sparks };
    async function load() {
      try { await document.fonts.ready; } catch (e) { /* נמשיך עם גופן המערכת */ }
      signTex = [['בית מרקחת', '#22ff88'], ['קפה', '#ffb020'], ['פיצה', '#ff2d95'], ['24/7', '#22d3ee'], ['מלון', '#9d5cff'], ['מוסך', '#ff5533'], ['מרפאה', '#22d3ee']]
        .map(([t, c]) => textTex([t], { w: 512, h: 200, color: c, border: c, glow: 26, max: 120 }));
      const erTex = textTex(['מיון'], { w: 512, h: 128, color: '#ffffff', bg: '#d0142c', max: 100 });
      const erSign = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.2), new THREE.MeshBasicMaterial({ map: erTex, toneMapped: false, color: new THREE.Color(1.7, 1.7, 1.7) })); erSign.position.set(0, 8, 5.1); hosp.add(erSign);
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environmentIntensity = .3;
      const env = new RGBELoader().loadAsync(ASSETS + 'night_city_1k.hdr').then(t => { t.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pmrem.fromEquirectangular(t).texture; t.dispose(); })
        .catch(() => { scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture; });
      const model = new GLTFLoader().loadAsync(ASSETS + 'ambulance.glb').then(gltf => {
        const m = gltf.scene; m.rotation.y = Math.PI; m.scale.setScalar(1.4);     // החזית במודל פונה ל־+Z; אנחנו נוסעים ל־-Z
        m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material.roughness = .42; o.material.metalness = .05; o.material.envMapIntensity = 1.1; o.material.color.setScalar(.78); o.material.side = THREE.FrontSide; } if (o.name.startsWith('wheel')) wheels.push(o); });
        carBody.add(m);
      });
      await Promise.all([env, model]); pmrem.dispose(); api.loaded = true;
    }
    api.ready = load();

    // ── סנכרון ישויות ──
    const live = new Map();
    function makeEnt(e) {
      if (e.type === 'orb') { const o = PROTO[e.kind].clone(true); o.userData.spin = o.children[0]; return o; }
      if (e.type === 'cone') return coneProto.clone(true);
      if (e.type === 'gate') return buildGate(e);
      return null;
    }
    function dropEnt(o) { scene.remove(o); if (o.userData.tex) { o.traverse(c => { if (c.isMesh && c.material.map && o.userData.tex.includes(c.material.map)) c.material.dispose(); }); o.userData.tex.forEach(t => t.dispose()); } }

    function resize(w, h) {
      renderer.setPixelRatio(pr); renderer.setSize(w, h, false); composer.setPixelRatio(pr); composer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    let sizeW = 4, sizeH = 4, slowFrames = 0;
    api.resize = (w, h) => { sizeW = w; sizeH = h; resize(w, h); };

    let camX = 0, fov = 70, blur = 0, vig = .5, susY = 0, susV = 0, lastLean = 0, pitch = 0, vSm = 0;
    api.render = (S, dt, rawDt) => {
      // איכות אדפטיבית: אם הקצב צונח, מורידים רזולוציה
      if (rawDt < .1) { slowFrames = rawDt > 1 / 40 ? slowFrames + 1 : Math.max(0, slowFrames - 2); if (slowFrames > 90 && pr > 1) { pr = Math.max(1, pr - .5); slowFrames = 0; resize(sizeW, sizeH); } }

      const v = S.v * ZS, D = S.dist * ZS, t = S.T; vSm = damp(vSm, v, 6, dt);
      const carX = S.px / LW * LANE, kSpeed = v / 24;
      roadMap.offset.y = D / 16 % 1; roadNormal.offset.y = D / 6 % 1; roadRough.offset.y = D / 24 % 1;

      // מעקות, פנסים, בניינים, שלטים — ממוחזרים לפי אינדקס גלובלי
      const pOff = D % POST_S;
      for (let i = 0; i < POST_N; i++) { const z = 25 - i * POST_S + pOff; put(posts, i * 2, -(ROAD_HALF + .3), .47, z); put(posts, i * 2 + 1, ROAD_HALF + .3, .47, z); }
      posts.instanceMatrix.needsUpdate = true;

      [-1, 1].forEach((sd, si) => {
        const Ds = D + (sd < 0 ? LAMP_S / 2 : 0), base = Math.floor(Ds / LAMP_S), off = Ds - base * LAMP_S; let lit = false;
        for (let i = 0; i < LAMP_N; i++) {
          const z = 24 - i * LAMP_S + off, k = si * LAMP_N + i;
          put(lampPole, k, sd * 7.4, 3.8, z); put(lampArm, k, sd * 6.3, 7.5, z); put(lampBulb, k, sd * 5.4, 7.42, z);
          put(lampHalo, k, sd * 5.4, 7.4, z + .05, 3.2, 3.2, 1); put(lampPool, k, sd * 4.4, .05, z, 12, 1, 17);
          if (!lit && (base + i) % 2 === 0 && z <= 10 && z > -50) { lit = true; streetL[si].position.set(sd * 5.2, 7.1, z); streetL[si].intensity = 110 * smooth(-50, -36, z) * (1 - smooth(4, 10, z)); }
        }
        if (!lit) streetL[si].intensity = 0;
      });
      for (const m of [lampPole, lampArm, lampBulb, lampHalo, lampPool]) m.instanceMatrix.needsUpdate = true;

      const bBase = Math.floor(D / BLD_S), bOff = D - bBase * BLD_S; let sgn = 0;
      [-1, 1].forEach((sd, si) => {
        for (let i = 0; i < BLD_N; i++) {
          const g = bBase + i, k = si * BLD_N + i, h1 = hash(g * 2 + si + 11.3), h2 = hash(g * 2 + si + 47.9), h3 = hash(g * 2 + si + 83.1);
          const w = 12 + h1 * 9, len = 13.5 + h2 * 3.5, ht = 13 + h3 * h3 * 56, z = 34 - i * BLD_S + bOff, x = sd * (10.4 + w / 2);
          put(blds, k, x, ht / 2, z, w, ht, len); bldSeed.array[k] = h1 * 100;
          if (h2 > .42) { const nh = Math.min(ht - 4, 6 + h1 * 16); put(neonBars, k, sd * 10.28, 3.2 + nh / 2, z + (h3 - .5) * len * .7, .22, nh, .22); neonBars.setColorAt(k, NEON[Math.floor(h3 * 97) % NEON.length]); }
          else put(neonBars, k, 0, -50, 0, .01, .01, .01);
          if ((g + si * 2) % 4 === 0 && sgn < signs.length && signTex.length) { const s = signs[sgn++]; s.visible = true; s.position.set(sd * 7.5, 6.4 + h1 * 2.6, z); s.material.map = signTex[Math.floor(h2 * 89) % signTex.length]; }
        }
      });
      for (let i = sgn; i < signs.length; i++) signs[i].visible = false;
      blds.instanceMatrix.needsUpdate = bldSeed.needsUpdate = neonBars.instanceMatrix.needsUpdate = neonBars.instanceColor.needsUpdate = true;

      // ── האמבולנס: הטיה, סבסוב, מתלים, גלגלים, צ'קלקה ──
      const leanV = (S.lean - lastLean) / Math.max(dt, .001); lastLean = S.lean;
      susV += (-190 * susY - 13 * susV) * dt + Math.abs(leanV) * .0009 + (Math.random() - .5) * kSpeed * .13 * dt; susY += susV * dt;
      if (S.shake > 8.5 && susY > -.02) susV = -1.3;
      pitch = damp(pitch, clamp((v - vSm) * .012, -.07, .07), 8, dt);
      car.position.set(carX, 0, 0);
      carBody.position.y = susY; carBody.rotation.set(-pitch, -S.lean * .2, S.lean * .13);
      for (const w of wheels) w.rotation.x += v * dt / .42;
      const bt = t * 5.2 % 1, onR = bt < .5 ? (bt % .25 < .14 ? 1 : .08) : 0, onB = bt >= .5 ? (bt % .25 < .14 ? 1 : .08) : 0;
      beaconMat[0].color.setRGB(.25 + 2.6 * onR, .02, .04); beaconMat[1].color.setRGB(.03, .08 + .7 * onB, .3 + 2.6 * onB);
      beaconL[0].intensity = 55 * onR; beaconL[1].intensity = 70 * onB; beaconHalo[0].material.opacity = .6 * onR; beaconHalo[1].material.opacity = .6 * onB;
      moon.position.set(carX + 7, 20, 9); moon.target.position.set(carX, 0, -4);

      // ── ישויות ──
      const seen = new Set(); let hospOn = false, gateActive = null;
      for (const e of S.ents) {
        if (e.type === 'hosp') { hospOn = true; hosp.position.set(0, 0, -e.z * ZS); continue; }
        let o = live.get(e); if (!o) { o = makeEnt(e); if (!o) continue; live.set(e, o); scene.add(o); }
        seen.add(e);
        if (e.type === 'gate') {
          o.position.set(0, 0, -e.z * ZS);
          if (e.open >= 0 && !o.userData.opened) { o.userData.opened = true; o.userData.lanes[e.open].forEach(p => p.visible = false); ring((e.open - 1) * LANE, o.position.z, e.opts[e.open].color); }
          if (e.shown && !e.resolved) gateActive = e;
        } else if (e.type === 'orb') {
          o.position.set((e.lane - 1) * LANE, 1.25 + Math.sin(t * 3.4 + e.z * 2) * .16, -e.z * ZS); o.userData.spin.rotation.y = t * 2.6 + e.lane;
        } else o.position.set((e.lane - 1) * LANE, 0, -e.z * ZS);
      }
      for (const [e, o] of live) if (!seen.has(e)) { dropEnt(o); live.delete(e); }
      hosp.visible = hospOn;
      tints.forEach((m, l) => { const o = gateActive && gateActive.opts[l]; m.visible = !!o; if (o) { m.material.color.set(o.color); m.scale.set(LANE - .2, 1, Math.max(.1, gateActive.z * ZS + 2)); } });
      for (const r of rings) if (r.visible) { r.userData.t += dt * 1.9; const k = r.userData.t; r.scale.setScalar(1 + k * 4.5); r.material.opacity = Math.max(0, 1 - k) * .7; if (k >= 1) r.visible = false; }

      // ── גשם וניצוצות ──
      for (let i = 0; i < RAIN; i++) {
        let y = rainSeed[i * 3 + 1] - 24 * dt, z = rainSeed[i * 3 + 2] + v * dt;
        if (y < 0) y += 18; if (z > 12) z -= 80;
        rainSeed[i * 3 + 1] = y; rainSeed[i * 3 + 2] = z; const x = rainSeed[i * 3] + camX, j = i * 6;
        rainPos[j] = x; rainPos[j + 1] = y; rainPos[j + 2] = z; rainPos[j + 3] = x; rainPos[j + 4] = y + .55; rainPos[j + 5] = z - v * .028;
      }
      rainGeo.attributes.position.needsUpdate = true;
      for (let i = 0; i < SP; i++) if (spLife[i] > 0) {
        spLife[i] -= dt; const j = i * 3; spVel[j + 1] -= 16 * dt; spPos[j] += spVel[j] * dt; spPos[j + 1] += spVel[j + 1] * dt; spPos[j + 2] += (spVel[j + 2] + v * .5) * dt;
        if (spPos[j + 1] < .05) { spPos[j + 1] = .05; spVel[j + 1] *= -.35; }
        if (spLife[i] <= 0) spPos[j + 1] = -999; else if (spLife[i] < .25) { spCol[j] *= .9; spCol[j + 1] *= .9; spCol[j + 2] *= .9; }
      }
      spGeo.attributes.position.needsUpdate = spGeo.attributes.color.needsUpdate = true;

      // ── מצלמת מרדף ──
      camX = damp(camX, carX * .62, 5.5, dt);
      fov = damp(fov, 70 + (S.dash ? 17 : 0) + (kSpeed - 1) * 3, 4, dt); camera.fov = fov; camera.updateProjectionMatrix();
      const sh = S.shake * .014 + Math.max(0, kSpeed - 1) * .02, back = 10.2 - (S.dash ? 1.2 : 0);
      camera.position.set(camX + (Math.random() - .5) * sh, 4.5 + susY * .4 + (Math.random() - .5) * sh, damp(camera.position.z, back, 4, dt));
      camera.lookAt(camX * .9 + carX * .22, 1.7, -17);
      sky.position.copy(camera.position);

      // ── פוסט ──
      blur = damp(blur, S.dash ? .13 : .012 + Math.max(0, kSpeed - .5) * .016, 5, dt); vig = damp(vig, gateActive ? .82 : .5, 4, dt);
      fxPass.uniforms.uBlur.value = blur; fxPass.uniforms.uVig.value = vig;
      fxPass.uniforms.uFlash.value = S.flash ? S.flash.a : 0; if (S.flash) fxPass.uniforms.uFlashCol.value.setRGB(...S.flash.c);
      composer.render(dt);
    };
    api.dispose = () => { live.forEach(dropEnt); live.clear(); composer.dispose(); renderer.dispose(); renderer.forceContextLoss(); };
    return api;
  }

  // ═════════ הפעלה ═════════
  gfx = createGfx(cv);
  function fit() {
    const h = Math.min(root.clientHeight, root.clientWidth * H / W), w = h * W / H; if (w < 2) return;
    stage.style.width = w + 'px'; stage.style.height = h + 'px'; stage.style.fontSize = (w / W * 16) + 'px';
    gfx.resize(Math.round(w), Math.round(h));
  }
  const ro = new ResizeObserver(fit); ro.observe(root); fit();
  gfx.ready.then(() => { if (dead) return; $('startBtn').disabled = false; $('startBtn').textContent = 'צא לקריאה'; })
    .catch(err => { if (dead) return; console.error(err); $('startBtn').textContent = 'הטעינה נכשלה — רענן את הדף'; });

  function draw(dt, rawDt) { gfx.render({ T, dist, v: vNow, px, lean, ents, dash: dash && !!activeGate, shake, flash }, dt, rawDt); }
  function frame(now) { if (dead) return; const raw = (now - last) / 1000, dt = Math.min(.05, raw); last = now; update(dt); draw(dt, raw); raf = requestAnimationFrame(frame); }
  hud(); raf = requestAnimationFrame(frame);

  // כלי בדיקה: מאפשר להריץ את הלוגיקה צעד־צעד מהקונסול
  if (import.meta.env.DEV) window.__prDbg = { update, draw, start, doDash, closeSheet, setLane: l => { lane = l; }, get s() { return { state, score, hearts, stepIdx, results, activeGate, ents, loaded: gfx.loaded }; } };

  return {
    destroy() {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', onKey);
      gfx.dispose(); if (AC) AC.close().catch(() => {});
      root.innerHTML = ''; root.classList.remove('pr-root');
    },
  };
}
