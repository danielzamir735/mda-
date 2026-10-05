// מנוע המשחק "ריצת פרוטוקול": לוגיקה + שכבת גרפיקה ב־Three.js.
// נשאר JavaScript רגיל (עם engine.d.ts לצדו) כי הוא הועבר כמות שהוא מאב־הטיפוס.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
      <div class="src">לפי "גישה למטופל עם קוצר נשימה", אוגדן BLS, אגף רפואה מד"א, ינואר 2016<br>מודל האמבולנס: Kenney Car Kit (CC0)</div>
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
    const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
    // רמת איכות: בנייד אין פוסט־פרוססינג והרזולוציה מוגבלת, כדי שהמשחק ירוץ חלק
    const shortSide = Math.min(screen.width, screen.height);
    const lite = matchMedia('(pointer: coarse)').matches || (shortSide > 0 && shortSide < 720);
    const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(lite ? Math.min(k, 1.1) : k);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    let pr = Math.min(devicePixelRatio || 1, lite ? 1.5 : 2);

    // שעת זהב בירושלים: השמש נמוכה מלפנים־משמאל, אובך חם באופק
    const scene = new THREE.Scene(), FOG = new THREE.Color(0xf3be8e), SUN = new THREE.Vector3(-.42, .3, -.86).normalize();
    scene.fog = new THREE.FogExp2(FOG, .0072); scene.background = FOG;
    const camera = new THREE.PerspectiveCamera(70, W / H, .3, 1600);
    camera.position.set(0, 4.5, 10.2);

    // ── פוסט־פרוססינג (רק ברמת האיכות המלאה) ──
    let composer = null, fxPass = null;
    if (!lite) {
      composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }));
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .22, .5, 1.0));
      fxPass = new ShaderPass({
        uniforms: { tDiffuse: { value: null }, uBlur: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform sampler2D tDiffuse; uniform float uBlur; varying vec2 vUv;
          void main(){
            vec2 c = vUv - vec2(.5, .44); float amt = uBlur * smoothstep(.08, .6, length(c * vec2(.75, 1.)));
            vec3 col = vec3(0.); for (int i = 0; i < 8; i++) col += texture2D(tDiffuse, vUv - c * amt * (float(i) / 7.)).rgb;   // radial blur בזינוק
            gl_FragColor = vec4(col / 8., 1.);
          }` });
      composer.addPass(fxPass); composer.addPass(new OutputPass());
    }
    // vignette והבזק צבע נעשים ב־CSS — זול בהרבה ממעבר shader נוסף
    const vigEl = document.createElement('div'), flashEl = document.createElement('div');
    for (const el of [vigEl, flashEl]) { el.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0'; canvas.after(el); }
    vigEl.style.background = 'radial-gradient(ellipse at 50% 46%, transparent 40%, rgba(20,8,28,.82) 100%)';

    // ── טקסטורות פרוצדורליות ──
    function canvasTex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); return t;
    }
    const roadMap = canvasTex(256, 512, (c, w, h) => {      // 12 מ' רוחב × 16 מ' אורך
      c.fillStyle = '#8b867f'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 5000; i++) { c.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.12)'; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      const mx = m => m / 12 * w;
      c.fillStyle = '#f4f1e8'; for (const m of [1.2 + LANE, 1.2 + 2 * LANE]) for (const y of [0, 256]) c.fillRect(mx(m) - 1.5, y, 3, 100);
      c.fillStyle = '#f2c94c'; c.fillRect(mx(1.2) - 1.5, 0, 3, h); c.fillRect(mx(10.8) - 1.5, 0, 3, h);
    });
    roadMap.repeat.set(1, ROAD_LEN / 16);
    const glowTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); });
    const shadowTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(20,10,30,.75)'); g.addColorStop(.55, 'rgba(20,10,30,.45)'); g.addColorStop(1, 'rgba(20,10,30,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); });
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

    // ── שמיים, שמש וקו הרקיע של העיר העתיקה ──
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uHor: { value: FOG }, uMid: { value: new THREE.Color(0xeda39a) }, uTop: { value: new THREE.Color(0x4a76b8) }, uSun: { value: SUN }, uSunCol: { value: new THREE.Color(1, .78, .46) } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform vec3 uHor, uMid, uTop, uSun, uSunCol; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float h = max(d.y, 0.);
          vec3 col = mix(uHor, uMid, smoothstep(0., .17, h)); col = mix(col, uTop, smoothstep(.12, .62, h));
          float band = sin(d.y * 34. + sin(atan(d.x, -d.z) * 3.) * 1.6) * .5 + .5;                       // פסי ענן דקים
          col += vec3(1., .62, .5) * .1 * smoothstep(.55, .95, band) * smoothstep(.06, .2, h) * (1. - smoothstep(.3, .5, h));
          float s = max(dot(d, uSun), 0.); col += uSunCol * (pow(s, 420.) * 7. + pow(s, 26.) * .6 + pow(s, 4.) * .2);
          gl_FragColor = vec4(col, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 24, 12), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
    const skylineTex = canvasTex(2048, 320, (c, w, h) => {
      const base = 250, A = '#d8a48b', B = '#9a6c70', G = '#5f5a4c', rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
      const dome = (x, y, r, col, k = 1) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r * k, 0, Math.PI, 0); c.fill(); };
      const minaret = (x, ht) => { c.fillStyle = B; c.fillRect(x - 4, base - ht, 8, ht); c.fillRect(x - 7, base - ht * .78, 14, 4); c.beginPath(); c.moveTo(x - 5, base - ht); c.lineTo(x, base - ht - 16); c.lineTo(x + 5, base - ht); c.fill(); };
      // שכבה רחוקה: הר הזיתים והרים
      c.fillStyle = A; c.beginPath(); c.moveTo(0, base);
      for (let x = 0; x <= w; x += 16) c.lineTo(x, 196 - Math.sin(x * .0042 + 1) * 22 - Math.sin(x * .013) * 7);
      c.lineTo(w, base); c.fill();
      for (let x = 0; x < w; x += 9 + rnd() * 14) { const bh = 5 + rnd() * 13; c.fillRect(x, 200 - Math.sin(x * .0042 + 1) * 22 - bh, 6 + rnd() * 9, bh + 20); }
      c.fillRect(1652, 122, 7, 70); c.fillRect(1648, 118, 15, 6);                                        // מגדל על הר הזיתים
      // שכבה קרובה: חומות העיר העתיקה
      c.fillStyle = B; c.fillRect(0, 214, w, base - 214);
      for (let x = 0; x < w; x += 14) c.fillRect(x, 208, 8, 7);
      for (let x = 90; x < w; x += 250) { c.fillRect(x, 190, 36, 26); for (let k = 0; k < 3; k++) c.fillRect(x + k * 13, 184, 8, 7); }
      for (let x = 0; x < w; x += 11 + rnd() * 16) { const bh = 6 + rnd() * 16; c.fillRect(x, 214 - bh, 8 + rnd() * 12, bh); }
      // כנסיית הדורמיציון
      c.fillRect(270, 176, 56, 40); c.beginPath(); c.moveTo(264, 176); c.lineTo(298, 142); c.lineTo(332, 176); c.fill();
      c.fillRect(338, 150, 16, 66); dome(346, 150, 9, B, 1.3);
      // מגדל דוד
      c.fillRect(486, 172, 78, 44); for (let k = 0; k < 6; k++) c.fillRect(486 + k * 14, 165, 8, 8); minaret(540, 150);
      // כנסיית הקבר
      c.fillRect(820, 186, 86, 30); dome(850, 186, 24, '#7d7480'); dome(892, 186, 14, '#7d7480');
      // כיפת הסלע ואל־אקצא
      c.fillStyle = '#8a86a6'; c.fillRect(1074, 184, 112, 32); c.fillStyle = B; c.fillRect(1100, 168, 60, 18);
      dome(1130, 170, 31, '#f2c23e', 1.12); c.fillStyle = '#ffe9a0'; c.beginPath(); c.ellipse(1118, 152, 9, 15, -.5, 0, 7); c.fill();
      c.fillStyle = '#f2c23e'; c.fillRect(1129, 126, 2, 12);
      c.fillStyle = B; c.fillRect(1250, 190, 96, 26); dome(1300, 190, 16, '#77707c');
      for (const [x, ht] of [[706, 96], [986, 84], [1452, 104], [1716, 88], [1900, 76]]) minaret(x, ht);
      c.fillStyle = G; for (let i = 0; i < 46; i++) { const x = rnd() * w, th = 16 + rnd() * 20; c.beginPath(); c.ellipse(x, 214 - th / 2, 3.5, th / 2, 0, 0, 7); c.fill(); }
      c.fillStyle = '#' + FOG.getHexString(); c.fillRect(0, base - 2, w, h - base + 2);                 // התחתית נמסה באובך
    });
    skylineTex.wrapS = skylineTex.wrapT = THREE.ClampToEdgeWrapping;
    const skyline = new THREE.Mesh(new THREE.PlaneGeometry(2400, 375), new THREE.MeshBasicMaterial({ map: skylineTex, alphaTest: .5, depthTest: false, depthWrite: false, fog: false }));
    skyline.frustumCulled = false; skyline.renderOrder = -9; scene.add(skyline);
    const sunGlow = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(1, .72, .4), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
    sunGlow.frustumCulled = false; scene.add(sunGlow);

    // ── תאורה: שמיים, שמש, והצ'קלקה האדומה — שלושה אורות בסך הכול ──
    scene.add(new THREE.HemisphereLight(0xffe6cc, 0x8a705c, 1.05));
    const sun = new THREE.DirectionalLight(0xffc98a, 2.3); sun.position.copy(SUN).multiplyScalar(50); scene.add(sun);

    // ── כביש, מדרכות וקרקע ──
    const lam = (color, extra) => new THREE.MeshLambertMaterial({ color, ...extra });
    const zMid = ROAD_Z0 - ROAD_LEN / 2;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, ROAD_LEN), lam(0xffffff, { map: roadMap }));
    road.rotation.x = -Math.PI / 2; road.position.z = zMid; scene.add(road);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, ROAD_LEN), lam(0xb39a72)); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.03, zMid); scene.add(ground);
    const stoneMat = lam(0xe2cb9c), walkMat = lam(0xd7c097);
    for (const sd of [-1, 1]) { const walk = new THREE.Mesh(new THREE.BoxGeometry(4.4, .22, ROAD_LEN), walkMat); walk.position.set(sd * (ROAD_HALF + 2.2), .11, zMid); scene.add(walk); }

    const dummy = new THREE.Object3D(), boxG = new THREE.BoxGeometry(1, 1, 1), tmpC = new THREE.Color();
    function inst(geo, mat, count) { const m = new THREE.InstancedMesh(geo, mat, count); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; }
    function put(mesh, i, x, y, z, sx = 1, sy = 1, sz = 1) { dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }
    // קבוצת תיבות קבועה כ־InstancedMesh אחד: [x, y, z, sx, sy, sz, צבע?]
    function boxes(mat, list) { const m = new THREE.InstancedMesh(boxG, mat, list.length); list.forEach((b, i) => { put(m, i, b[0], b[1], b[2], b[3], b[4], b[5]); if (list[0][6] !== undefined) m.setColorAt(i, tmpC.set(b[6] ?? 0xffffff)); }); m.frustumCulled = false; return m; }

    // עמודי תאורה וברושים לאורך המדרכה
    const LAMP_S = 34, LAMP_N = 11, poleMat = lam(0x4a4640);
    const lampPole = inst(new THREE.CylinderGeometry(.08, .12, 7.4, 6), poleMat, LAMP_N * 2), lampArm = inst(boxG, poleMat, LAMP_N * 2);
    const TREE_S = 17, TREE_N = 22, trees = inst(new THREE.ConeGeometry(.78, 7, 7), lam(0x4d6340), TREE_N * 2);

    // בנייני אבן ירושלמית — אבן, חלונות מקושתים ותאורת שקיעה מצוירים ב־shader
    const bldMat = new THREE.ShaderMaterial({
      fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSun: { value: SUN } }]),
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
        uniform vec3 uSun; varying vec2 vWin; varying float vSeed; varying vec3 vN;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          vec3 stone = vec3(.72, .57, .36) * (.9 + .22 * fract(vSeed * 7.3));
          stone *= 1. - .07 * step(.9, fract(vWin.y / .55)) - .05 * h21(floor(vWin / vec2(1.1, .55)));          // נדבכי אבן
          vec3 light = vec3(1., .7, .4) * 1.75 * max(dot(vN, uSun), 0.) + vec3(.42, .43, .56) + vec3(.25, .16, .1) * max(vN.y, 0.);
          vec3 col = stone * light;
          if (abs(vN.y) < .5) {
            vec2 g = vWin / vec2(2.7, 3.2), id = floor(g), p = (fract(g) - vec2(.5, .58)) * vec2(2.7, 3.2);
            float win = (step(abs(p.x), .5) * step(p.y, 0.) * step(-1.25, p.y) + step(length(p), .5) * step(0., p.y)) * step(1., id.y);   // חלון מקושת
            float r = h21(id + vSeed * 17.);
            vec3 glass = vec3(.07, .09, .13) + vec3(1., .62, .3) * .75 * step(.72, r) * max(dot(vN, uSun) + .25, 0.) + vec3(1., .8, .45) * .8 * step(.93, r);
            col = mix(col, glass, win);
            col *= 1. - .22 * step(vWin.y, 3.1) * step(.5, fract(vWin.x / 5.4 + vSeed));                         // פתחי חנויות בקומת הקרקע
          }
          gl_FragColor = vec4(col, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }` });
    const BLD_S = 17, BLD_N = 24, bldGeo = new THREE.BoxGeometry(1, 1, 1), bldSeed = new THREE.InstancedBufferAttribute(new Float32Array(BLD_N * 2), 1);
    bldSeed.setUsage(THREE.DynamicDrawUsage); bldGeo.setAttribute('aSeed', bldSeed);
    const blds = inst(bldGeo, bldMat, BLD_N * 2);
    // דודי שמש על הגגות
    const tankGeo = new THREE.CylinderGeometry(.42, .42, 1.5, 8); tankGeo.rotateZ(Math.PI / 2);
    const panelGeo = new THREE.BoxGeometry(1.7, .08, 1.2); panelGeo.rotateX(.55);
    const tanks = inst(tankGeo, lam(0xf2f0ea), BLD_N * 2), panels = inst(panelGeo, lam(0x27303f), BLD_N * 2);

    // ── אתרי ירושלים לצד הדרך ──
    const whiteMat = lam(0xf4f1ea, { emissive: 0x4a4038 }), darkMat = lam(0x3b3531), tintMat = lam(0xffffff);
    const brown = t => new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.35), new THREE.MeshBasicMaterial({ map: textTex([t], { w: 512, h: 128, color: '#fff', bg: '#6b4423', border: '#f3e6d0', max: 78 }) }));
    function landmark(side, len, label, build) {
      const g = new THREE.Group(); g.visible = false; build(g);
      const sign = brown(label), post = new THREE.Mesh(boxG, poleMat), sx = (side || -1) * 6.75, sz = len / 2 + 9;
      sign.position.set(sx, 3.3, sz); post.scale.set(.14, 2.7, .14); post.position.set(sx, 1.35, sz - .05); g.add(sign, post);
      scene.add(g); return { g, side, len };
    }
    let millSails = null;
    const LM = [
      landmark(-1, 0, 'הרכבת הקלה', g => {
        const cars = []; for (const k of [-1, 0, 1]) cars.push([-8.25, 1.95, k * 12.7, 2.2, 3, 12.1, 0xdfe3e8], [-7.13, 2.45, k * 12.7, .06, 1, 10.6, 0x1c2430], [-7.13, 1.05, k * 12.7, .06, .2, 12.1, 0xc8102e], [-8.25, .32, k * 12.7, 1.6, .5, 9, 0x2a2a2e]);
        g.add(boxes(tintMat, cars), boxes(darkMat, [[-8.9, .25, 0, .1, .07, 150], [-7.6, .25, 0, .1, .07, 150], [-8.25, 5.6, 0, .05, .05, 150]]));
      }),
      landmark(0, 26, 'גשר המיתרים', g => {
        g.add(boxes(whiteMat, [[4, 9.6, 0, 70, .9, 6], [-31, 4.6, 0, 2.4, 9.2, 5], [39, 4.6, 0, 2.4, 9.2, 5]]));
        const lower = new THREE.Mesh(boxG, whiteMat), upper = new THREE.Mesh(boxG, whiteMat);
        lower.scale.set(2.3, 30, 2.3); lower.position.set(-15.3, 24.2, 0); lower.rotation.z = -.32;
        upper.scale.set(1.9, 26, 1.9); upper.position.set(-13.45, 50.7, 0); upper.rotation.z = .22; g.add(lower, upper);
        const pts = []; for (let i = 0; i < 16; i++) { const k = (i + 2) / 18; pts.push(-10.6 - 5.7 * k, 38 + 25.4 * k, 0, -6 + i * 2.7, 10.1, i % 2 ? 2.4 : -2.4); }
        const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        const cables = new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 })); cables.frustumCulled = false; g.add(cables);
      }),
      landmark(1, 50, 'שוק מחנה יהודה', g => {
        const AW = [0xc8102e, 0xf4f1ea, 0x2f8f4e, 0xf2b632, 0x2d6cb5], CR = [0xf08a24, 0x7ab648, 0xd63b3b, 0xf2d24b], list = [[15.8, 3.2, 0, 1, 6.4, 46, 0xe2cb9c]];
        for (let k = 0; k < 7; k++) { const z = k * 6.4 - 19.2;
          list.push([13, .65, z, 3, 1.3, 4.8, 0x8a5a36], [12.3, 3.35, z, 4.6, .2, 5.4, AW[k % 5]], [10.2, 1.7, z - 2.4, .12, 3.4, .12, 0x4a4640], [10.2, 1.7, z + 2.4, .12, 3.4, .12, 0x4a4640]);
          for (let j = 0; j < 3; j++) list.push([12.5, 1.55, z - 1.5 + j * 1.5, 1.6, .5, 1.1, CR[(k + j) % 4]]); }
        g.add(boxes(tintMat, list));
      }),
      landmark(-1, 28, 'טחנת הרוח', g => {
        g.add(boxes(stoneMat, [[-17, .6, 0, 15, 1.2, 22]]));
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 3.3, 13, 12), stoneMat); tower.position.set(-17, 7.7, 0);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(2.7, 3.2, 12), darkMat); cap.position.set(-17, 15.8, 0);
        millSails = new THREE.Group(); millSails.position.set(-14.2, 13.2, 0);
        for (let k = 0; k < 4; k++) { const arm = new THREE.Group(), sail = new THREE.Mesh(boxG, whiteMat); sail.scale.set(.14, 8.4, 1.3); sail.position.y = 4.6; arm.rotation.x = k * Math.PI / 2; arm.add(sail); millSails.add(arm); }
        const hub = new THREE.Mesh(boxG, darkMat); hub.scale.set(3, .5, .5); hub.position.set(-15.4, 13.2, 0); g.add(tower, cap, millSails, hub);
      }),
      landmark(1, 100, 'העיר העתיקה · מגדל דוד', g => {
        const list = [[15, 5.5, 0, 3, 11, 100], [14.6, 7.5, -42, 5, 15, 7], [14.6, 7.5, 34, 5, 15, 7], [17.5, 10, -8, 10, 20, 10]];
        for (let k = -16; k <= 16; k++) list.push([15, 11.6, k * 3.05, 3, 1.2, 1.5]);
        for (let k = -2; k <= 2; k++) list.push([13 + 0, 20.6, -8 + k * 2.2, 1, 1.2, 1.1], [22, 20.6, -8 + k * 2.2, 1, 1.2, 1.1]);
        g.add(boxes(stoneMat, list), boxes(darkMat, [[13.45, 3.2, 20, .2, 6.4, 4.4]]));
        const min = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 14, 10), stoneMat); min.position.set(17.5, 27, -8);
        const bal = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, .7, 10), stoneMat); bal.position.set(17.5, 30, -8);
        const top = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.5, 10), darkMat); top.position.set(17.5, 36.2, -8); g.add(min, bal, top);
      }),
    ];
    const LM_S = 190;

    // ── קווי מהירות (רק בזינוק) וניצוצות ──
    const SL = 70, slPos = new Float32Array(SL * 6), slSeed = Array.from({ length: SL }, () => [Math.random() * 6.28, 3.6 + Math.random() * 4, Math.random() * 46 - 40]);
    const slGeo = new THREE.BufferGeometry(); slGeo.setAttribute('position', new THREE.BufferAttribute(slPos, 3).setUsage(THREE.DynamicDrawUsage));
    const speedLines = new THREE.LineSegments(slGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false })); speedLines.frustumCulled = false; scene.add(speedLines);
    const SP = lite ? 260 : 520, spPos = new Float32Array(SP * 3).fill(-999), spCol = new Float32Array(SP * 3), spVel = new Float32Array(SP * 3), spLife = new Float32Array(SP); let spNext = 0, spLive = 0;
    const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3).setUsage(THREE.DynamicDrawUsage)); spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3).setUsage(THREE.DynamicDrawUsage));
    const sparkPts = new THREE.Points(spGeo, new THREE.PointsMaterial({ size: .3, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, sizeAttenuation: true }));
    sparkPts.frustumCulled = false; scene.add(sparkPts);
    function sparks(laneOff, y, color, n, pow) {
      tmpC.set(color).multiplyScalar(lite ? 1.1 : 1.8); const x = laneOff * LANE; if (lite) n = Math.ceil(n / 2);
      for (let k = 0; k < n; k++) { const i = spNext = (spNext + 1) % SP, a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2, v = pow * (.25 + Math.random() * .75);
        spPos[i * 3] = x + (Math.random() - .5) * 1.6; spPos[i * 3 + 1] = y + (Math.random() - .5) * 1.8; spPos[i * 3 + 2] = -2.6;
        spVel[i * 3] = Math.cos(a) * Math.cos(b) * v; spVel[i * 3 + 1] = Math.sin(b) * v + 3; spVel[i * 3 + 2] = Math.sin(a) * Math.cos(b) * v * .6;
        spCol[i * 3] = tmpC.r; spCol[i * 3 + 1] = tmpC.g; spCol[i * 3 + 2] = tmpC.b; spLife[i] = .5 + Math.random() * .6; }
      spLive = SP;
    }
    const rings = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(.92, 1.08, 40), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); m.visible = false; m.userData.t = 1; scene.add(m); return m; });
    function ring(x, z, color) { const r = rings.find(r => !r.visible) || rings[0]; r.position.set(x, 2.2, z); r.material.color.copy(hdr(color, 1.8)); r.userData.t = 0; r.visible = true; }

    // ── האמבולנס: צ'קלקה אדומה בלבד ──
    const addMat = (color, opacity) => new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const car = new THREE.Group(), carBody = new THREE.Group(); car.add(carBody); scene.add(car);
    const carShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 7.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); carShadow.rotation.x = -Math.PI / 2; carShadow.position.set(.5, .04, .9); car.add(carShadow);
    const wheels = [], beaconMat = [0, 1].map(() => new THREE.MeshBasicMaterial({ toneMapped: false })), beaconHalo = [0, 1].map(() => new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), addMat(new THREE.Color(1, .08, .1), 1)));
    [-1, 1].forEach((sd, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .16, .34), beaconMat[i]); b.position.set(sd * .42, 2.62, .25); beaconHalo[i].position.set(sd * .42, 2.66, .46); carBody.add(b, beaconHalo[i]); });
    const beaconL = new THREE.PointLight(0xff1428, 0, 13, 1.8); beaconL.position.set(0, 3.9, .6); carBody.add(beaconL);
    const tailMat = new THREE.MeshBasicMaterial({ color: hdr(0xff2018, 1.6), toneMapped: false });
    for (const sd of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(.13, .24, .04), tailMat); t.position.set(sd * .93, 1.3, 2.29); carBody.add(t); }

    // ── פריטים לאיסוף ──
    const std = (color, emissive, ei = .35) => new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: ei });
    const mWhite = std(0xf8f8f8, 0xffffff, .25), mRed = std(0xef233c, 0xff1830, .55), mSkin = std(0xf2c9a0, 0xf2a060, .3), mPad = std(0xfdeedd, 0xffe0c0, .3);
    const haloGeo = new THREE.PlaneGeometry(2.6, 2.6);
    function withHalo(g, color) { const h = new THREE.Mesh(haloGeo, addMat(new THREE.Color(color).multiplyScalar(.8), .6)); h.position.z = -.25; const o = new THREE.Group(); o.add(g, h); return o; }
    const PROTO = {};
    { const g = new THREE.Group(), cap = new THREE.Mesh(new THREE.CapsuleGeometry(.27, .62, 4, 12), mWhite), half = new THREE.Mesh(new THREE.CylinderGeometry(.275, .275, .31, 12), mRed), end = new THREE.Mesh(new THREE.SphereGeometry(.275, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mRed);
      half.position.y = .155; end.position.y = .31; g.add(cap, half, end); g.rotation.z = .7; const s = new THREE.Group(); s.add(g); PROTO.pill = withHalo(s, 0xff6070); }
    { const sh = new THREE.Shape(); sh.moveTo(25, 25); sh.bezierCurveTo(25, 25, 20, 0, 0, 0); sh.bezierCurveTo(-30, 0, -30, 35, -30, 35); sh.bezierCurveTo(-30, 55, -10, 77, 25, 95); sh.bezierCurveTo(60, 77, 80, 55, 80, 35); sh.bezierCurveTo(80, 35, 80, 0, 50, 0); sh.bezierCurveTo(35, 0, 25, 25, 25, 25);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 26, bevelEnabled: true, bevelThickness: 7, bevelSize: 6, bevelSegments: 2, curveSegments: 8 }); geo.center(); geo.rotateZ(Math.PI); geo.scale(.0105, .0105, .0105);
      const s = new THREE.Group(); s.add(new THREE.Mesh(geo, mRed)); PROTO.heart = withHalo(s, 0xff2040); }
    { const s = new THREE.Group(), box = new THREE.Mesh(new THREE.BoxGeometry(1, .72, .42), mWhite), c1 = new THREE.Mesh(new THREE.BoxGeometry(.15, .44, .46), mRed), c2 = new THREE.Mesh(new THREE.BoxGeometry(.44, .15, .46), mRed), hd = new THREE.Mesh(new THREE.TorusGeometry(.17, .035, 6, 12, Math.PI), mWhite);
      hd.position.y = .36; s.add(box, c1, c2, hd); PROTO.kit = withHalo(s, 0xffffff); }
    { const g = new THREE.Group(), strip = new THREE.Mesh(new THREE.BoxGeometry(1.25, .36, .09), mSkin), pad = new THREE.Mesh(new THREE.BoxGeometry(.4, .37, .12), mPad); g.add(strip, pad); g.rotation.z = -.5; const s = new THREE.Group(); s.add(g); PROTO.plaster = withHalo(s, 0xffc890); }
    const coneProto = new THREE.Group();
    { const o = std(0xff6a10, 0xff4400, .35), w = std(0xffffff, 0xffffff, .4), body = new THREE.Mesh(new THREE.ConeGeometry(.4, 1.05, 14), o), band = new THREE.Mesh(new THREE.CylinderGeometry(.2, .275, .2, 14), w), base = new THREE.Mesh(new THREE.BoxGeometry(.9, .07, .9), o);
      body.position.y = .56; band.position.y = .55; base.position.y = .035; coneProto.add(body, band, base); }

    // ── שערים ──
    const gantryMat = lam(0x5a5d68);
    const GH = 4.3, sheetG = new THREE.PlaneGeometry(LANE - .28, GH - .1), signG = new THREE.PlaneGeometry(LANE - .12, 1.6);
    function buildGate(g) {
      const grp = new THREE.Group(); grp.userData = { lanes: [], tex: [] };
      const beam = new THREE.Mesh(boxG, gantryMat); beam.scale.set(LANE * 3 + 1.4, .22, .22); beam.position.y = GH + 2.05; grp.add(beam);
      for (const sd of [-1, 1]) { const col = new THREE.Mesh(boxG, gantryMat); col.scale.set(.22, GH + 2.1, .22); col.position.set(sd * (LANE * 1.5 + .6), (GH + 2.1) / 2, 0); grp.add(col); }
      g.opts.forEach((o, l) => {
        const x = (l - 1) * LANE, parts = [];
        if (!o) {
          const bar = new THREE.Mesh(boxG, new THREE.MeshBasicMaterial({ map: hazardTex })); bar.scale.set(LANE - .3, .75, .22); bar.position.set(x, 1, 0); grp.add(bar);
          for (const sd of [-1, 1]) { const leg = new THREE.Mesh(boxG, gantryMat); leg.scale.set(.12, 1.3, .12); leg.position.set(x + sd * 1.3, .65, 0); grp.add(leg); }
          const t = textTex(['✕'], { w: 256, h: 128, color: '#ff4757', bg: 'rgba(8,9,18,.92)', max: 110 }); grp.userData.tex.push(t);
          const s = new THREE.Mesh(signG, new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); s.position.set(x, GH + 1.05, .05); grp.add(s);
        } else {
          const neon = new THREE.MeshBasicMaterial({ color: hdr(o.color, 1.7), toneMapped: false });
          for (const sd of [-1, 1]) { const p = new THREE.Mesh(boxG, neon); p.scale.set(.16, GH, .16); p.position.set(x + sd * (LANE / 2 - .1), GH / 2, 0); grp.add(p); parts.push(p); }
          const top = new THREE.Mesh(boxG, neon); top.scale.set(LANE - .04, .16, .16); top.position.set(x, GH, 0); grp.add(top); parts.push(top);
          const sheet = new THREE.Mesh(sheetG, new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); sheet.position.set(x, GH / 2, 0); grp.add(sheet); parts.push(sheet);
          const t = textTex(o.label.split('\n'), { color: '#ffffff', bg: 'rgba(8,9,18,.94)', border: o.color, max: 150 }); grp.userData.tex.push(t);
          const sign = new THREE.Mesh(signG, new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); sign.position.set(x, GH + 1.05, .05); grp.add(sign);
        }
        grp.userData.lanes.push(parts);
      });
      return grp;
    }
    const tintGeo = new THREE.PlaneGeometry(1, 1); tintGeo.rotateX(-Math.PI / 2); tintGeo.translate(0, 0, -.5);
    const tints = [0, 1, 2].map(l => { const m = new THREE.Mesh(tintGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: .34, depthWrite: false, toneMapped: false })); m.position.set((l - 1) * LANE, .05, 2); m.visible = false; scene.add(m); return m; });

    // ── בית החולים ──
    const hosp = new THREE.Group(); hosp.visible = false; scene.add(hosp);
    {
      const geo = new THREE.BoxGeometry(1, 1, 1); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array([3.3, 8.1, 5.7]), 1));
      const body = new THREE.InstancedMesh(geo, bldMat, 3); body.frustumCulled = false;
      [[0, 15, -9.5, 28, 30, 17], [-23, 8, -9, 18, 16, 15], [23, 8, -9, 18, 16, 15]].forEach((b, i) => put(body, i, ...b));
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(15, .6, 6.5), darkMat); canopy.position.set(0, 5.9, 1.8);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.4), new THREE.MeshBasicMaterial({ color: hdr(0xffe2a8, 1.2), toneMapped: false })); door.position.set(0, 2.7, -.94);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(6, 6, .5), whiteMat); plate.position.set(0, 25, -.8);
      const crossMat = new THREE.MeshBasicMaterial({ color: hdr(0xe0142c, 1.5), toneMapped: false });
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.4, .6), crossMat), c2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.5, .6), crossMat); c1.position.set(0, 25, -.6); c2.position.set(0, 25, -.6);
      hosp.add(body, canopy, door, plate, c1, c2, boxes(darkMat, [[-6.9, 2.8, 4.6, .5, 5.6, .5], [6.9, 2.8, 4.6, .5, 5.6, .5], [0, 2.7, -.9, .18, 5.4, .1]]));
    }

    // ── טעינת נכסים ──
    const api = { loaded: false, sparks, lite };
    async function load() {
      try { await document.fonts.ready; } catch (e) { /* נמשיך עם גופן המערכת */ }
      const erSign = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.2), new THREE.MeshBasicMaterial({ map: textTex(['מיון'], { w: 512, h: 128, color: '#ffffff', bg: '#d0142c', max: 100 }) })); erSign.position.set(0, 8, 5.1);
      const nameSign = new THREE.Mesh(new THREE.PlaneGeometry(17, 3.4), new THREE.MeshBasicMaterial({ map: textTex(['שערי צדק'], { w: 640, h: 128, color: '#17324d', bg: '#f4f1ea', max: 96 }) })); nameSign.position.set(0, 18.5, -.9);
      hosp.add(erSign, nameSign);
      // השתקפויות על האמבולנס: מפת סביבה קטנה שנוצרת מהשמיים עצמם, בלי קובץ HDRI
      const pmrem = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(sky.geometry, skyMat));
      scene.environment = pmrem.fromScene(envScene, 0, .1, 2000).texture; pmrem.dispose();
      const gltf = await new GLTFLoader().loadAsync(ASSETS + 'ambulance.glb');
      const m = gltf.scene; m.rotation.y = Math.PI; m.scale.setScalar(1.4);     // החזית במודל פונה ל־+Z; אנחנו נוסעים ל־-Z
      m.traverse(o => { if (o.isMesh) { o.material.roughness = .45; o.material.metalness = .05; o.material.envMapIntensity = .9; o.material.side = THREE.FrontSide; } if (o.name.startsWith('wheel')) wheels.push(o); });
      redOnlyLightbar(m);
      carBody.add(m); api.loaded = true;
    }
    // במודל המקורי פס האורות חציו כחול. מעבירים כל קודקוד שצבעו כחול בוהק לצבע האדום של אותה טקסטורה.
    function redOnlyLightbar(model) {
      let img = null; model.traverse(o => { if (o.isMesh && o.material.map) img = o.material.map.image; }); if (!img) return;
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
      const px = cx.getImageData(0, 0, c.width, c.height).data, at = (u, v) => { const x = Math.min(c.width - 1, Math.floor((u - Math.floor(u)) * c.width)), y = Math.min(c.height - 1, Math.floor((v - Math.floor(v)) * c.height)), i = (y * c.width + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
      const isBlue = ([r, g, b]) => b > 150 && b > r * 1.6 && b > g * 1.15, isRed = ([r, g, b]) => r > 170 && r > g * 2.2 && r > b * 2.2;
      const meshes = []; model.traverse(o => { if (o.isMesh && o.geometry.attributes.uv) meshes.push(o); });
      let red = null; for (const o of meshes) { const uv = o.geometry.attributes.uv; for (let i = 0; i < uv.count && !red; i++) if (isRed(at(uv.getX(i), uv.getY(i)))) red = [uv.getX(i), uv.getY(i)]; }
      if (!red) return;
      for (const o of meshes) { const uv = o.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) if (isBlue(at(uv.getX(i), uv.getY(i)))) uv.setXY(i, red[0], red[1]); uv.needsUpdate = true; }
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
      renderer.setPixelRatio(pr); renderer.setSize(w, h, false); if (composer) { composer.setPixelRatio(pr); composer.setSize(w, h); }
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    let sizeW = 4, sizeH = 4, slowFrames = 0;
    api.resize = (w, h) => { sizeW = w; sizeH = h; resize(w, h); };

    let camX = 0, fov = 70, blur = 0, vig = 0, dashK = 0, susY = 0, susV = 0, lastLean = 0, pitch = 0, vSm = 0;
    const zones = [];
    api.render = (S, dt, rawDt) => {
      // איכות אדפטיבית: אם הקצב צונח, מורידים רזולוציה
      if (rawDt < .1) { slowFrames = rawDt > 1 / 45 ? slowFrames + 1 : Math.max(0, slowFrames - 2); if (slowFrames > 70 && pr > 1) { pr = Math.max(1, pr - .25); slowFrames = 0; resize(sizeW, sizeH); } }

      const v = S.v * ZS, D = S.dist * ZS, t = S.T; vSm = damp(vSm, v, 6, dt);
      const carX = S.px / LW * LANE, kSpeed = v / 24;
      roadMap.offset.y = D / 16 % 1;

      // ── ישויות (לפני הסביבה, כי בית החולים מפנה לעצמו מקום בין הבניינים) ──
      const seen = new Set(); let hospOn = false, gateActive = null; zones.length = 0;
      for (const e of S.ents) {
        if (e.type === 'hosp') { hospOn = true; hosp.position.set(0, 0, -e.z * ZS); zones.push([0, -e.z * ZS - 40, -e.z * ZS + 12]); continue; }
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
      for (const r of rings) if (r.visible) { r.userData.t += dt * 1.9; const k = r.userData.t; r.scale.setScalar(1 + k * 4.5); r.material.opacity = Math.max(0, 1 - k) * .8; if (k >= 1) r.visible = false; }

      // ── אתרי ירושלים: שלוש משבצות ממוחזרות, כל אחת מקבלת אתר לפי אינדקס גלובלי ──
      const lBase = Math.floor(D / LM_S), lOff = D - lBase * LM_S;
      for (const l of LM) l.g.visible = false;
      for (let j = 0; j < 3; j++) { const l = LM[(lBase + j) % LM.length], z = 70 - j * LM_S + lOff; if (hospOn && z < hosp.position.z + 60) continue; l.g.visible = true; l.g.position.z = z; if (l.len) zones.push([l.side, z - l.len / 2 - 5, z + l.len / 2 + 5]); }
      if (millSails) millSails.rotation.x = t * .5;
      const blocked = (sd, z0, z1) => { for (const q of zones) if ((q[0] === 0 || q[0] === sd) && z1 > q[1] && z0 < q[2]) return true; return false; };

      // ── סביבת הרחוב: בניינים, דודי שמש, ברושים ועמודי תאורה ──
      const bBase = Math.floor(D / BLD_S), bOff = D - bBase * BLD_S;
      [-1, 1].forEach((sd, si) => {
        for (let i = 0; i < BLD_N; i++) {
          const g = bBase + i, k = si * BLD_N + i, h1 = hash(g * 2 + si + 11.3), h2 = hash(g * 2 + si + 47.9), h3 = hash(g * 2 + si + 83.1);
          const w = 11 + h1 * 7, len = 13 + h2 * 3.5, ht = (3 + Math.floor(h3 * 4)) * 3.2 + 1, z = 34 - i * BLD_S + bOff, x = sd * (10.5 + w / 2);
          if (blocked(sd, z - len / 2, z + len / 2)) { put(blds, k, 0, -80, 0, .01, .01, .01); put(tanks, k, 0, -80, 0); put(panels, k, 0, -80, 0); continue; }
          put(blds, k, x, ht / 2, z, w, ht, len); bldSeed.array[k] = h1 * 100;
          const rx = x - sd * w * .22, rz = z + (h2 - .5) * len * .5; put(tanks, k, rx, ht + 1.25, rz); put(panels, k, rx, ht + .5, rz + 1.1);
        }
        const tOff = (D + TREE_S / 2) % TREE_S;
        for (let i = 0; i < TREE_N; i++) { const z = 30 - i * TREE_S + tOff, s = .8 + hash(Math.floor((D + TREE_S / 2) / TREE_S) + i + si * 31.7) * .45; put(trees, si * TREE_N + i, sd * 9.95, 3.5 * s + .2, z, 1, s, 1); }
        const pOff = (D + si * LAMP_S / 2) % LAMP_S;
        for (let i = 0; i < LAMP_N; i++) { const z = 28 - i * LAMP_S + pOff, k = si * LAMP_N + i; put(lampPole, k, sd * 6.75, 3.7, z); put(lampArm, k, sd * 5.9, 7.3, z, 1.9, .12, .3); }
      });
      for (const m of [blds, tanks, panels, trees, lampPole, lampArm]) m.instanceMatrix.needsUpdate = true;
      bldSeed.needsUpdate = true;

      // ── האמבולנס: הטיה, סבסוב, מתלים, גלגלים, צ'קלקה ──
      const leanV = (S.lean - lastLean) / Math.max(dt, .001); lastLean = S.lean;
      susV += (-190 * susY - 13 * susV) * dt + Math.abs(leanV) * .0009 + (Math.random() - .5) * kSpeed * .13 * dt; susY += susV * dt;
      if (S.shake > 8.5 && susY > -.02) susV = -1.3;
      pitch = damp(pitch, clamp((v - vSm) * .012, -.07, .07), 8, dt);
      car.position.set(carX, 0, 0);
      carBody.position.y = susY; carBody.rotation.set(-pitch, -S.lean * .2, S.lean * .13);
      for (const w of wheels) w.rotation.x += v * dt / .42;
      const bt = t * 4.6 % 1, on = [bt < .5 ? (bt % .25 < .15 ? 1 : .1) : 0, bt >= .5 ? (bt % .25 < .15 ? 1 : .1) : 0];
      for (let i = 0; i < 2; i++) { beaconMat[i].color.setRGB(.3 + (lite ? .7 : 2.2) * on[i], .03, .05); beaconHalo[i].material.opacity = .85 * on[i]; }
      beaconL.intensity = 16 * Math.max(on[0], on[1]);

      // ── קווי מהירות וניצוצות ──
      dashK = damp(dashK, S.dash ? 1 : 0, 7, dt); speedLines.visible = dashK > .02;
      if (speedLines.visible) {
        speedLines.material.opacity = dashK * .55;
        for (let i = 0; i < SL; i++) { const q = slSeed[i]; q[2] += v * dt * 1.4; if (q[2] > 8) q[2] -= 48; const x = camX + Math.cos(q[0]) * q[1], y = 4 + Math.sin(q[0]) * q[1] * .8, j = i * 6;
          slPos[j] = x; slPos[j + 1] = y; slPos[j + 2] = q[2]; slPos[j + 3] = x; slPos[j + 4] = y; slPos[j + 5] = q[2] - 5.5; }
        slGeo.attributes.position.needsUpdate = true;
      }
      if (spLive > 0) {
        spLive = 0;
        for (let i = 0; i < SP; i++) if (spLife[i] > 0) {
          spLife[i] -= dt; const j = i * 3; spVel[j + 1] -= 16 * dt; spPos[j] += spVel[j] * dt; spPos[j + 1] += spVel[j + 1] * dt; spPos[j + 2] += (spVel[j + 2] + v * .5) * dt;
          if (spPos[j + 1] < .05) { spPos[j + 1] = .05; spVel[j + 1] *= -.35; }
          if (spLife[i] <= 0) spPos[j + 1] = -999; else spLive++;
        }
        spGeo.attributes.position.needsUpdate = spGeo.attributes.color.needsUpdate = true;
      }

      // ── מצלמת מרדף ──
      camX = damp(camX, carX * .62, 5.5, dt);
      fov = damp(fov, 70 + (S.dash ? 17 : 0) + (kSpeed - 1) * 3, 4, dt); camera.fov = fov; camera.updateProjectionMatrix();
      const sh = S.shake * .014 + Math.max(0, kSpeed - 1) * .02, back = 10.2 - (S.dash ? 1.2 : 0);
      camera.position.set(camX + (Math.random() - .5) * sh, 4.5 + susY * .4 + (Math.random() - .5) * sh, damp(camera.position.z, back, 4, dt));
      camera.lookAt(camX * .9 + carX * .22, 1.7, -17);
      sky.position.copy(camera.position);
      skyline.position.set(camera.position.x, camera.position.y + 100, camera.position.z - 950);
      sunGlow.position.copy(SUN).multiplyScalar(900).add(camera.position);

      // ── שכבות CSS ורינדור ──
      vig = damp(vig, gateActive ? .75 : .18, 4, dt); vigEl.style.opacity = vig.toFixed(2);
      if (S.flash) { flashEl.style.background = `radial-gradient(ellipse at 50% 46%, transparent 25%, rgba(${S.flash.c.map(x => Math.round(x * 255))},.95) 100%)`; flashEl.style.opacity = Math.min(1, S.flash.a).toFixed(2); } else flashEl.style.opacity = 0;
      if (composer) { blur = damp(blur, S.dash ? .11 : 0, 5, dt); fxPass.uniforms.uBlur.value = blur; fxPass.enabled = blur > .004; composer.render(dt); }
      else renderer.render(scene, camera);
    };
    api.dispose = () => { live.forEach(dropEnt); live.clear(); if (composer) composer.dispose(); renderer.dispose(); renderer.forceContextLoss(); };
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
