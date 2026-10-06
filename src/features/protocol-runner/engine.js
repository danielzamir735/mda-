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
    <p class="pr-note"><span class="pr-tag"></span><span class="pr-finding"></span></p>
    <div class="pr-node"><h2 class="pr-question"></h2><span class="pr-timer">צומת בעוד <b class="pr-timerBar"></b> מ׳</span></div>
    <div class="pr-chips"></div>
    <div class="pr-hint">בחרת נתיב? החלק למעלה כדי לזנק</div>
  </div>

  <button class="pr-mute" aria-label="השתק">🔊</button>
  <button class="pr-home" hidden>תפריט</button>

  <div class="pr-title overlay show">
    <div>
      <h1 class="logo">ריצת <span>פרוטוקול</span></h1>
      <p class="sub">שלושה מטופלים בכל משמרת. בכל צומת פנה לפי הפרוטוקול.</p>
      <h3 class="pick">בחר פרוטוקול</h3>
      <div class="pr-protos protos"></div>
      <h3 class="pick">בחר רמה</h3>
      <div class="pr-levels levels"></div>
      <p class="tips">החלק ימינה או שמאלה כדי לבחור נתיב לפני הצומת. החלק למעלה כדי לזנק.</p>
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
      <button class="pr-menuBtn btn ghost">החלף רמה</button>
      <div class="src">לפי "<span class="pr-srcName"></span>", אוגדן BLS, אגף רפואה מד"א, ינואר 2016<br>מודל האמבולנס: Kenney Car Kit (CC0)</div>
    </div>
  </div>
</div>
`;

export function createProtocolRunner(root) {
  // ═════════ הפרוטוקול: גישה למטופל עם קוצר נשימה (אוגדן BLS, עמ' 35–36) ═════════
  // צמתי התרשים לפי הסדר. city הוא אינדקס העיר שבה הצומת מופיע תמיד — עוגן זיכרון לסדר השלבים.
  const SEAT_OPTS = () => [{ t: 'ישיבה,\nרגליים למטה', ok: true }, { t: 'שכיבה\nעל הגב' }, { t: 'הליכה\nלאמבולנס' }];
  const EVAC_OPTS = () => [{ t: 'פינוי דחוף\nוניטור בדרך', ok: true }, { t: 'להמתין במקום\nלשיפור' }, { t: 'להשאיר\nבבית' }];
  const SOB_NODES = {
    choke: { city: 0, name: 'חשד להשתנקות מגוף זר?', short: 'השתנקות\nמגוף זר?', yn: true,
      yes: 'חשד להשתנקות — עוברים לפרוטוקול השתנקות.', no: 'אין חשד להשתנקות — ממשיכים.',
      rule: 'השאלה הראשונה בפרוטוקול היא חשד להשתנקות מגוף זר. אם יש חשד, עוברים לפרוטוקול השתנקות.' },
    allergy: { city: 1, name: 'חשד לתגובה אלרגית?', short: 'תגובה\nאלרגית?', yn: true,
      yes: 'חשד לתגובה אלרגית — עוברים לפרוטוקול אנאפילקסיס.', no: 'אין סימני אלרגיה — ממשיכים לגישה הכללית למטופל חולה.',
      rule: 'זיהוי תגובה אלרגית לפי הפרוטוקול: הופעה פתאומית, חשיפה אפשרית לאלרגן ותסמינים נלווים כמו גרד, אורטיקריה ואנגיואדמה. אם יש חשד, עוברים לפרוטוקול אנאפילקסיס.' },
    seat: { city: 2, name: 'גישה כללית והושבה במנוחה', short: 'הושבה\nבמנוחה', q: 'איך מנחים את המטופל?', opts: SEAT_OPTS,
      ok: 'גישה כללית למטופל חולה, והושבה במנוחה מלאה עם רגליים כלפי מטה.',
      rule: 'לפי הפרוטוקול: ככל הניתן לסייע למטופל לשבת עם רגליים כלפי מטה, לפעול להרגעתו ולהקפיד על מנוחה מלאה.' },
    o2: { city: 3, name: 'חמצן וסיוע נשימתי', short: 'חמצן וסיוע\nנשימתי', q: 'מה הטיפול הנשימתי?',
      opts: p => [{ t: 'חמצן במסיכה\n10–15 ל׳/דקה', ok: p.o2 === 'mask' }, { t: 'הנשמה\nבמפוח', ok: p.o2 === 'bvm' }, { t: 'אין צורך\nבחמצן' }],
      mask: 'מעל 20 נשימות בדקה או מצוקה נשימתית — חמצן במסיכה, 10–15 ליטר לדקה.', bvm: 'מטופל שאינו נושם או נושם פחות מ־8 נשימות בדקה — הנשמה במפוח מחובר לחמצן.',
      rule: 'חמצן במסיכה בקצב 10–15 ליטר לדקה ניתן לכל מטופל מעל 20 נשימות בדקה או במצוקה נשימתית. הנשמה במפוח מחובר לחמצן ניתנת למטופל אפנאי או מתחת ל־8 נשימות בדקה.' },
    obstr: { city: 4, name: 'חשד למחלה חסימתית?', short: 'מחלה\nחסימתית?', yn: true,
      yes: 'מחלה חסימתית — שקול סיוע באינהלציה, ואז פינוי.', no: 'אין חשד למחלה חסימתית — בודקים חשד לגודש ריאתי.',
      rule: 'מחלה חסימתית לפי הפרוטוקול: אסטמה, COPD, דלקת סימפונות. אם יש חשד, שוקלים סיוע באינהלציה ומפנים.' },
    congest: { city: 5, name: 'חשד לגודש ריאתי?', short: 'גודש\nריאתי?', yn: true,
      yes: 'חשד לגודש ריאתי — שקול טיפול בכפוף לפרוטוקול כאב בחזה ממקור לבבי.', no: 'אין חשד לגודש ריאתי — מפנים.',
      rule: 'אחרי שנשללה מחלה חסימתית בודקים חשד לגודש ריאתי. אם יש חשד, שוקלים טיפול בכפוף לפרוטוקול כאב בחזה ממקור לבבי.' },
    evac: { city: 6, name: 'פינוי דחוף', short: 'פינוי\nדחוף', q: 'מה השלב הבא?', opts: EVAC_OPTS,
      ok: 'פינוי דחוף לחבירה או לבית החולים הקרוב, ניטור בדרך ודיווח מקדים.',
      rule: 'הפרוטוקול מסתיים בפינוי דחוף לחבירה או לבית החולים הקרוב, המשך ניטור וטיפול במהלך הפינוי ושקילת דיווח מקדים.' },
  };
  const SOB_ORDER = ['choke', 'allergy', 'seat', 'o2', 'obstr', 'congest', 'evac'];
  // הצומת הבא לפי התרשים. ערך שמתחיל ב־'>' הוא יציאה לפרוטוקול אחר; 'hosp' הוא ההגעה לבית החולים.
  const SOB_NEXT = { choke: a => a ? '>פרוטוקול השתנקות' : 'allergy', allergy: a => a ? '>פרוטוקול אנאפילקסיס' : 'seat', seat: () => 'o2', o2: () => 'obstr',
    obstr: a => a ? 'evac' : 'congest', congest: a => a ? '>פרוטוקול כאב בחזה ממקור לבבי' : 'evac', evac: () => 'hosp' };

  // חמישה מטופלים — אחד לכל סיום אפשרי של הפרוטוקול.
  // ans: התשובה בצמתי כן/לא · o2: מסיכה או מפוח · find: הממצא שמוצג בכל צומת ברמה המודרכת.
  const SOB_PATIENTS = [
    { who: 'גבר בן 58', brief: 'במסעדה, באמצע ארוחה. התחיל להשתעל בפתאומיות, אוחז בצוואר ומתקשה להוציא קול.', ans: { choke: true },
      find: { choke: 'התחיל להשתעל בפתאומיות באמצע ארוחה. אוחז בצוואר ומתקשה להוציא קול.' } },
    { who: 'אישה בת 31', brief: 'נעקצה מדבורה לפני רבע שעה. קוצר נשימה שהופיע בפתאומיות, גרד ופריחה בכל הגוף ונפיחות בשפתיים.', ans: { choke: false, allergy: true },
      find: { choke: 'לא אכלה לאחרונה ואין סיפור של שאיפת גוף זר. מדברת ומשתעלת.', allergy: 'נעקצה מדבורה. הופעה פתאומית, גרד, אורטיקריה ונפיחות בשפתיים.' } },
    { who: 'גבר בן 67', brief: 'יושב על כיסא בסלון, נושם מהר ומתקשה לדבר. ברקע COPD, מעשן שנים רבות ומשתמש במשאפים. ההחמרה הדרגתית מאתמול.', ans: { choke: false, allergy: false, obstr: true }, o2: 'mask',
      find: { choke: 'קוצר הנשימה החמיר בהדרגה מאתמול. לא אכל בשעות האחרונות, משתעל ומדבר במילים בודדות.', allergy: 'אין גרד, אין פריחה ואין נפיחות בפנים או בשפתיים. לא נחשף לאלרגן ידוע.',
        seat: 'המטופל חסר מנוחה ומנסה לקום וללכת.', o2: '28 נשימות בדקה, שימוש בשרירי עזר ורטרקציות.', obstr: 'ברקע COPD, מעשן שנים רבות ומשתמש במשאפים. נשמעים צפצופים בנשיפה.', evac: 'המטופל יושב, מקבל חמצן ומעט רגוע יותר.' } },
    { who: 'אישה בת 79', brief: 'התעוררה בלילה עם קוצר נשימה. ברקע אי ספיקת לב ויתר לחץ דם, ללא מחלת ריאות. ליחה מרובה וכאבים בחזה.', ans: { choke: false, allergy: false, obstr: false, congest: true }, o2: 'mask',
      find: { choke: 'התעוררה משינה עם קוצר נשימה. לא אכלה ואין סיפור של שאיפת גוף זר.', allergy: 'אין גרד, אין פריחה ואין נפיחות. לא נחשפה לאלרגן ידוע.',
        seat: 'חסרת מנוחה, מתקשה לנשום בשכיבה.', o2: '30 נשימות בדקה, מאמץ נשימתי ניכר וכחלון בשפתיים.', obstr: 'אין ברקע אסטמה או מחלת ריאות כרונית. לא משתמשת במשאפים, לא נשמעים צפצופים.', congest: 'ברקע אי ספיקת לב ויתר לחץ דם. ליחה מרובה וכאבים בחזה.' } },
    { who: 'גבר בן 72', brief: 'חום ושיעול עם ליחה מזה שלושה ימים. כעת חלש מאוד ונושם לאט. ללא מחלות רקע, לא מעשן.', ans: { choke: false, allergy: false, obstr: false, congest: false }, o2: 'bvm',
      find: { choke: 'ההחמרה הדרגתית, לאורך שלושה ימים. אין סיפור של שאיפת גוף זר.', allergy: 'אין גרד, אין פריחה ואין נפיחות. לא נחשף לאלרגן ידוע.',
        seat: 'שוכב במיטה, חלש מאוד.', o2: '6 נשימות בדקה, נשימות שטחיות ושינוי במצב ההכרה.', obstr: 'אין ברקע אסטמה או COPD. לא מעשן ולא משתמש במשאפים, לא נשמעים צפצופים.', congest: 'אין ברקע אי ספיקת לב או יתר לחץ דם. אין כאבים בחזה.', evac: 'המטופל מונשם במפוח ומצבו יציב.' } },
  ];
  const CALLS = 3;   // מטופלים במשמרת אחת

  // ═════════ הפרוטוקול: גישה למטופל עם כאב בחזה ממקור לבבי (אוגדן BLS) ═════════
  // התרשים כאן ישר, בלי הסתעפויות; ההחלטות הן בשלבי ה"שקול": חמצן, אספירין וניטרטים, לפי הדגשים.
  const CHEST_NODES = {
    approach: { city: 0, name: 'גישה כללית, אנמנזה ובדיקה מכוונת', short: 'אנמנזה\nובדיקה', q: 'מה השלב הראשון?',
      opts: () => [{ t: 'אנמנזה ובדיקה\nגופנית מכוונת', ok: true }, { t: 'ניטרטים\nתת לשוני' }, { t: 'פינוי\nמיידי' }],
      ok: 'גישה כללית למטופל חולה, ואז אנמנזה ובדיקה גופנית מכוונת.',
      rule: 'הפרוטוקול נפתח בגישה כללית למטופל חולה ובאנמנזה ובדיקה גופנית מכוונת: מועד הופעת הסימפטומים, מחלות רקע וגורמי סיכון, וטיפול תרופתי קבוע בדגש על אספירין, ניטרטים ונוגדי קרישה.' },
    seat: { city: 1, name: 'הושבה ומנוחה מלאה', short: 'הושבה\nומנוחה', q: 'איך מנחים את המטופל?', find: 'המטופל עומד ומתהלך בחדר באי שקט.',
      opts: () => [{ t: 'ישיבה\nומנוחה מלאה', ok: true }, { t: 'הליכה\nלאמבולנס' }, { t: 'להמשיך\nבפעילות' }],
      ok: 'מושיבים את המטופל במידת האפשר ומוודאים שהוא במנוחה מלאה.',
      rule: 'לפי הפרוטוקול: הושב את המטופל במידת האפשר, וודא כי הוא מצוי במנוחה מלאה.' },
    o2: { city: 2, name: 'לתת חמצן?', short: 'חמצן?', yn: true,
      yes: 'יש סימני מצוקה נשימתית — נותנים חמצן.', no: 'אין סימני מצוקה נשימתית — לא נדרש חמצן כרגע.',
      rule: 'חמצן ניתן אם המטופל מראה סימנים של מצוקה נשימתית: כחלון, טכיפניאה, שימוש בשרירי עזר, רטרקציות.' },
    aspirin: { city: 3, name: 'לתת אספירין בלעיסה?', short: 'אספירין\nבלעיסה?', yn: true,
      yes: 'אין התוויות נגד — אספירין בלעיסה, 160–325 מ"ג.', no: 'יש התוויית נגד, או שנטל אספירין בשעה האחרונה — לא נותנים.',
      rule: 'אספירין ניתן בלעיסה, 160–325 מ"ג, אחרי וידוא התוויות נגד: רגישות יתר ידועה, כיב פעיל, דימום מדרכי העיכול בשלושת החודשים האחרונים, היסטוריה של אסטמה פעילה. נותנים גם למי שנוטל אספירין בקביעות, בתנאי שלא נטל בשעה האחרונה.' },
    nitro: { city: 4, name: 'לסייע במתן ניטרטים?', short: 'ניטרטים\nתת לשוני?', yn: true,
      yes: 'עדיין כואב, נוטל בקביעות ואין התוויות נגד — מסייעים: תת לשוני, עד 2 מנות בהפרש של 2–3 דקות.', no: 'התנאים לא מתקיימים — לא מסייעים במתן ניטרטים.',
      rule: 'מסייעים רק למטופל שעדיין סובל מכאב בחזה ונוטל ניטרטים בקביעות לפי הוראת רופא. מודדים לחץ דם לפני כל מנה. התוויות נגד: לחץ דם סיסטולי מתחת ל־100, או תרופות לאין־אונות ב־36 השעות האחרונות.' },
    evac: { city: 6, name: 'פינוי דחוף', short: 'פינוי\nדחוף', q: 'מה השלב הבא?', opts: EVAC_OPTS, find: 'הטיפול הראשוני ניתן והמטופל במנוחה.',
      ok: 'פינוי דחוף לחבירה או לבית החולים הקרוב, ניטור בדרך ודיווח מקדים.',
      rule: 'הפרוטוקול מסתיים בפינוי דחוף לחבירה או לבית החולים הקרוב, המשך ניטור וטיפול במהלך הפינוי ושקילת דיווח מקדים.' },
  };
  const CHEST_ORDER = ['approach', 'seat', 'o2', 'aspirin', 'nitro', 'evac'];
  const CHEST_NEXT = { approach: () => 'seat', seat: () => 'o2', o2: () => 'aspirin', aspirin: () => 'nitro', nitro: () => 'evac', evac: () => 'hosp' };
  // חמישה מטופלים עם צירופים שונים של חמצן, אספירין וניטרטים
  const CHEST_PATIENTS = [
    { who: 'גבר בן 61', brief: 'כאב לוחץ בקדמת החזה שמקרין ליד שמאל, מזה חצי שעה. מזיע ויש בחילה. נוטל ניטרטים בקביעות. נושם רגיל, לחץ דם 135/85.', ans: { o2: false, aspirin: true, nitro: true },
      find: { o2: '16 נשימות בדקה, ללא כחלון וללא מאמץ נשימתי.', aspirin: 'אין רגישות לאספירין, אין כיב ואין דימום מדרכי העיכול. לא נטל אספירין היום.', nitro: 'עדיין כואב. נוטל ניטרטים בקביעות לפי הוראת רופא. לחץ דם 135/85. לא נטל תרופות לאין־אונות.' } },
    { who: 'אישה בת 74', brief: 'סוכרתית. חולשה, בחילה ולחץ לא ברור בחזה מזה שעה. נושמת מהר ושפתיה כחלחלות. ברקע כיב קיבה פעיל. אינה נוטלת ניטרטים.', ans: { o2: true, aspirin: false, nitro: false },
      find: { o2: '26 נשימות בדקה, כחלון בשפתיים ושימוש בשרירי עזר.', aspirin: 'ברקע כיב קיבה פעיל.', nitro: 'אינה נוטלת ניטרטים בקביעות.' } },
    { who: 'גבר בן 55', brief: 'כאב לוחץ בחזה שמקרין לצוואר, מזה 40 דקות. נוטל אספירין וניטרטים בקביעות. אמש נטל תרופה לאין־אונות. נושם רגיל.', ans: { o2: false, aspirin: true, nitro: false },
      find: { o2: '18 נשימות בדקה, ללא סימני מצוקה נשימתית.', aspirin: 'נוטל אספירין בקביעות; המנה האחרונה הייתה הבוקר, לפני יותר משעה. אין התוויות נגד.', nitro: 'עדיין כואב ונוטל ניטרטים בקביעות, אבל נטל תרופה לאין־אונות אמש, בתוך 36 השעות האחרונות.' } },
    { who: 'גבר בן 68', brief: 'כאב בחזה והזעה מרובה מזה שעה. חיוור, נושם מהר ובמאמץ. נוטל ניטרטים בקביעות. לחץ דם 90/60.', ans: { o2: true, aspirin: true, nitro: false },
      find: { o2: '28 נשימות בדקה, נשימות מאומצות ורטרקציות.', aspirin: 'אין רגישות לאספירין, אין כיב ואין דימום מדרכי העיכול. לא נטל אספירין היום.', nitro: 'עדיין כואב ונוטל ניטרטים בקביעות, אבל לחץ הדם 90/60.' } },
    { who: 'אישה בת 59', brief: 'כאב לוחץ בחזה שמקרין לגב, מזה 20 דקות. לעסה אספירין בעצמה לפני רבע שעה. נוטלת ניטרטים בקביעות. נושמת רגיל, לחץ דם 140/90.', ans: { o2: false, aspirin: false, nitro: true },
      find: { o2: '14 נשימות בדקה, ללא כחלון וללא מאמץ נשימתי.', aspirin: 'לעסה אספירין בעצמה לפני רבע שעה, כלומר בתוך השעה האחרונה.', nitro: 'עדיין כואבת. נוטלת ניטרטים בקביעות לפי הוראת רופא. לחץ דם 140/90. לא נטלה תרופות לאין־אונות.' } },
  ];

  // ═════════ הפרוטוקול: אנאפילקסיס (אוגדן BLS) ═════════
  // שתי הסתעפויות (דום לב? תגובה אנאפילקטית?) ושתי החלטות לפי הדגשים: אישור המוקד לפני אדרנלין, ומנה נוספת.
  const ANA_NODES = {
    assess: { city: 0, name: 'הערכה ראשונית: הכרה, נשימה ודופק', short: 'הערכה\nראשונית', q: 'מה בודקים קודם?',
      opts: () => [{ t: 'הכרה,\nנשימה ודופק', ok: true }, { t: 'מזריקים\nאדרנלין' }, { t: 'פינוי\nמיידי' }],
      ok: 'מתחילים בהערכה ראשונית של מצב ההכרה, הנשימה והדופק.',
      rule: 'הפרוטוקול נפתח בהערכה ראשונית של מצב ההכרה, הנשימה והדופק, עוד לפני האנמנזה והטיפול.' },
    arrest: { city: 1, name: 'דום לב?', short: 'דום לב?', yn: true,
      yes: 'דום לב — מבצעים החייאה לפי הפרוטוקול המקובל, כולל אדרנלין תוך שרירי.', no: 'אין דום לב — משלימים אנמנזה ובדיקה גופנית.',
      rule: 'אחרי ההערכה הראשונית שואלים אם יש דום לב. אם כן, מבצעים החייאה לפי הפרוטוקול המקובל, כולל מתן אדרנלין תוך שרירי. אם לא, משלימים אנמנזה ובדיקה גופנית.' },
    ana: { city: 2, name: 'תגובה אנאפילקטית?', short: 'תגובה\nאנאפילקטית?', yn: true,
      yes: 'תגובה אנאפילקטית — שוקלים מתן אדרנלין תוך שרירי.', no: 'לא תגובה אנאפילקטית — טיפול סימפטומטי ופינוי לבית החולים.',
      rule: 'אבחנה, אחד מהבאים: מחלה אקוטית עם הפרעה נשימתית או המודינמית; התפתחות מהירה של תסמינים עוריים, נשימתיים, גסטרו או המודינמיים אחרי חשיפה אפשרית לאלרגן; סימנים לירידה בפרפוזיה או ירידה חדה בלחץ הדם הסיסטולי אחרי חשיפה לאלרגן.' },
    epi: { city: 3, name: 'אדרנלין: נדרש אישור מהמוקד?', short: 'אדרנלין\nתוך שרירי', yn: true,
      yes: 'אין סכנת חיים מיידית — נדרש אישור רופא במוקד לפני השימוש במזרק. בירך: מבוגר 0.3 מ"ג, ילד 0.15 מ"ג.', no: 'סכנת חיים מיידית — מזריקים בלי לחכות לאישור. בירך: מבוגר 0.3 מ"ג, ילד 0.15 מ"ג.',
      rule: 'אדרנלין במזרק אוטומטי ניתן בשריר הירך: מבוגר 0.3 מ"ג, ילד 0.15 מ"ג. בסכנת חיים מיידית (חוסר הכרה, חסימת דרכי אוויר עליונות, קוצר נשימה קיצוני, כחלון, דופק לא נמוש) אין צורך באישור המוקד. בכל מקרה אחר נדרש אישור רופא במוקד הרפואי.' },
    support: { city: 4, name: 'חמצן במסיכה, קו ורידי ונוזלים', short: 'חמצן\nונוזלים', q: 'מה נותנים אחרי האדרנלין?', find: 'האדרנלין ניתן. המטופל שוכב על גבו עם רגליים מורמות.',
      opts: () => [{ t: 'חמצן במסיכה\nושקילת נוזלים', ok: true }, { t: 'אספירין\nבלעיסה' }, { t: 'אין צורך\nבטיפול נוסף' }],
      ok: 'חמצן במסיכה, 10–15 ליטר לדקה, ושקילת קו ורידי ועירוי נוזלים.',
      rule: 'אחרי האדרנלין נותנים חמצן במסיכה בקצב 10–15 ליטר לדקה ושוקלים התקנת קו ורידי ומתן עירוי נוזלים. המטופל שוכב על גבו עם רגליים מורמות.' },
    recheck: { city: 5, name: 'הערכה חוזרת: מנה נוספת של אדרנלין?', short: 'הערכה\nחוזרת', yn: true,
      yes: 'אין תגובה, או שהתגובה אינה מספקת — אפשר לתת מנה נוספת כעבור 5–10 דקות, ככל שיש.', no: 'המטופל הגיב לטיפול — אין צורך במנה נוספת כרגע.',
      rule: 'אחרי הטיפול מבצעים הערכה חוזרת. אפשר לתת מנה נוספת של אדרנלין כעבור 5–10 דקות אם אין תגובה או שהתגובה אינה מספקת.' },
    evac: { city: 6, name: 'פינוי דחוף', short: 'פינוי\nדחוף', q: 'מה השלב הבא?', opts: EVAC_OPTS, find: 'הטיפול ניתן והמטופל בהשגחה.',
      ok: 'פינוי דחוף לבית החולים הקרוב, שקילת חבירה עם צוות ALS ודיווח מקדים לבית החולים הקולט.',
      rule: 'הפרוטוקול מסתיים בפינוי דחוף לבית החולים הקרוב, שקילת חבירה עם צוות ALS והעברת דיווח מקדים לבית החולים הקולט.' },
  };
  const ANA_ORDER = ['assess', 'arrest', 'ana', 'epi', 'support', 'recheck', 'evac'];
  const ANA_NEXT = { assess: () => 'arrest', arrest: a => a ? '>החייאה לפי הפרוטוקול' : 'ana', ana: a => a ? 'epi' : '>טיפול סימפטומטי ופינוי', epi: () => 'support', support: () => 'recheck', recheck: () => 'evac', evac: () => 'hosp' };
  // חמישה מטופלים: דום לב, תגובה שאינה אנאפילקטית, ושלושה מקרי אנאפילקסיס בחומרה שונה
  const ANA_PATIENTS = [
    { who: 'ילד בן 9', brief: 'נעקץ מצרעה בטיול, אלרגיה ידועה לעקיצות. התמוטט: אינו מגיב, אינו נושם ואין דופק.', ans: { arrest: true },
      find: { arrest: 'אינו מגיב, אינו נושם, דופק לא נמוש.' } },
    { who: 'אישה בת 26', brief: 'תפרחת מגרדת בזרועות אחרי מגע בצמח. נושמת רגיל, דופק ולחץ דם תקינים, בלי נפיחות בפנים.', ans: { arrest: false, ana: false },
      find: { arrest: 'בהכרה מלאה, נושמת רגיל, דופק סדיר ונמוש היטב.', ana: 'תפרחת מגרדת בזרועות בלבד. אין הפרעה נשימתית או המודינמית, ואין מעורבות של מערכת נוספת.' } },
    { who: 'גבר בן 34', brief: 'אכל בוטנים לפני 10 דקות, אלרגיה ידועה. נפיחות בלשון ובשפתיים, נשימה מחרחרת וכחלון. נושא מזרק אדרנלין.', ans: { arrest: false, ana: true, epi: false, recheck: true },
      find: { arrest: 'הכרה מעורפלת, נושם במאמץ, דופק מהיר וחלש.', ana: 'התפתחות מהירה אחרי חשיפה לאלרגן: נפיחות בלשון, נשימה מחרחרת ודופק מהיר וחלש.', epi: 'נשימה מחרחרת, כחלון והכרה מעורפלת.', recheck: 'עברו 7 דקות מהמנה הראשונה. עדיין נשימה מחרחרת וכחלון, בלי שיפור.' } },
    { who: 'אישה בת 45', brief: 'קיבלה אנטיביוטיקה לפני 20 דקות. תפרחת מגרדת בכל הגוף, בחילה והקאות, צפצופים קלים. בהכרה מלאה, לחץ דם 110/70.', ans: { arrest: false, ana: true, epi: true, recheck: false },
      find: { arrest: 'בהכרה מלאה, נושמת, דופק מהיר ונמוש.', ana: 'התפתחות מהירה אחרי תרופה: תפרחת בכל הגוף, הקאות וצפצופים — עור, מערכת העיכול ונשימה.', epi: 'בהכרה מלאה, מדברת, בלי כחלון, דופק נמוש היטב.', recheck: 'עברו 8 דקות. הצפצופים חלפו, הנשימה רגועה והתפרחת דועכת.' } },
    { who: 'ילד בן 6', brief: 'אכל בגן עוגה עם אגוזים. נפיחות בעפעפיים ובשפתיים, שיעול וצפצופים, הקיא פעמיים. ערני ובוכה. משקלו 20 ק"ג.', ans: { arrest: false, ana: true, epi: true, recheck: true },
      find: { arrest: 'ערני ובוכה, נושם, דופק מהיר ונמוש.', ana: 'התפתחות מהירה אחרי חשיפה לאלרגן: נפיחות בפנים, צפצופים והקאות.', epi: 'ערני ובוכה, צפצופים בלי כחלון, דופק נמוש היטב.', recheck: 'עברו 10 דקות מהמנה הראשונה. הצפצופים מחמירים והנפיחות בשפתיים גדלה.' } },
  ];

  // הפרוטוקולים שאפשר לתרגל. המשתמש בוחר אחד במסך הפתיחה.
  const PROTOCOLS = {
    sob: { name: 'קוצר נשימה', title: 'גישה למטופל עם קוצר נשימה', nodes: SOB_NODES, order: SOB_ORDER, next: SOB_NEXT, patients: SOB_PATIENTS },
    ana: { name: 'אנאפילקסיס', title: 'אנאפילקסיס', nodes: ANA_NODES, order: ANA_ORDER, next: ANA_NEXT, patients: ANA_PATIENTS },
    chest: { name: 'כאב בחזה', title: 'גישה למטופל עם כאב בחזה ממקור לבבי', nodes: CHEST_NODES, order: CHEST_ORDER, next: CHEST_NEXT, patients: CHEST_PATIENTS },
  };
  let proto = 'sob', NODES = SOB_NODES, ORDER = SOB_ORDER, NEXT = SOB_NEXT, PATIENTS = SOB_PATIENTS;
  function useProto(k) { proto = PROTOCOLS[k] ? k : 'sob'; ({ nodes: NODES, order: ORDER, next: NEXT, patients: PATIENTS } = PROTOCOLS[proto]); }
  // שלוש רמות: במודרך עונים על שאלת הצומת; בשליפה ובבעל פה בוחרים איזה שלב בא עכשיו.
  const LEVELS = [{ name: 'מודרך', hint: 'השאלה מוצגת, אתה עונה' }, { name: 'שליפה', hint: 'אתה בוחר מה השלב הבא' }, { name: 'בעל פה', hint: 'בלי תיאור המטופל בצמתים, ומהר יותר' }];
  const LANE_COLORS = ['#5CE6F2', '#FF6FDD', '#FFE14A'];   // תכלת, ורוד וצהוב מתרשימי האוגדן
  const KINDS = ['pill', 'heart', 'kit', 'plaster'], KIND_COLOR = { pill: '#f87171', heart: '#fb7185', kit: '#f4f4f5', plaster: '#f2c9a0' };

  // ═════════ לוגיקת המשחק (לא תלויה בגרפיקה) ═════════
  const W = 420, H = 760, LW = 104, SHOW_Z = 30;
  root.classList.add('pr-root'); root.innerHTML = TEMPLATE;
  const stage = root.querySelector('.pr-stage'), cv = root.querySelector('.pr-c');
  const FONT = "'Secular One', " + (getComputedStyle(root).fontFamily || 'sans-serif');
  const $ = id => root.querySelector('.pr-' + id);
  const laneX = l => (l - 1) * LW, rnd = n => Math.floor(Math.random() * n), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const flatten = t => t.replace('\n', ' ');

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
  let dead = false, raf = 0, lastMeters = -1;
  let state = 'title', T = 0, dist = 0, vNow = 0, last = performance.now();
  let lane = 1, px = 0, lean = 0, speed = 8, slow = 0, dash = false;
  let ents = [], shake = 0, flash = null;
  let score = 0, hearts = 3, streak = 0, answered = 0, activeGate = null, cardTimer = 0;
  // level: הרמה שנבחרה · calls: המטופלים של המשמרת · nodeKey: הצומת הנוכחי בפרוטוקול · trail: השלבים שכבר עברו בקריאה · log: סיכום לכל קריאה
  let level = 0, calls = [], callIdx = 0, patient = null, nodeKey = 'choke', trail = [], log = [], callLog = null, pendingKey = null, pendingDir = 0, handoffT = 0, cityNow = 0;
  try { level = clamp(+localStorage.getItem('pr-level') || 0, 0, 2); useProto(localStorage.getItem('pr-proto')); } catch (e) { /* בלי אחסון מקומי נשארים בברירת המחדל */ }

  function drawLevels() { $('levels').innerHTML = LEVELS.map((l, i) => `<button type="button" data-l="${i}" class="${i === level ? 'on' : ''}"><b>${l.name}</b><span>${l.hint}</span></button>`).join(''); }
  $('levels').onclick = e => { const b = e.target.closest('button'); if (!b) return; level = +b.dataset.l; try { localStorage.setItem('pr-level', level); } catch (err) { /* לא נורא */ } drawLevels(); };
  drawLevels();
  function drawProtos() { $('protos').innerHTML = Object.keys(PROTOCOLS).map(k => `<button type="button" data-p="${k}" class="${k === proto ? 'on' : ''}">${PROTOCOLS[k].name}</button>`).join(''); }
  $('protos').onclick = e => { const b = e.target.closest('button'); if (!b) return; useProto(b.dataset.p); try { localStorage.setItem('pr-proto', proto); } catch (err) { /* לא נורא */ } drawProtos(); };
  drawProtos();

  function reset() {
    lane = 1; px = 0; speed = 8; slow = 0; dash = false; ents = []; shake = 0; flash = null;
    score = 0; hearts = 3; streak = 0; answered = 0; activeGate = null; log = []; calls = []; callIdx = 0;
    hud(); hideCard();
  }
  function start() {
    if (!gfx || !gfx.loaded) return;
    reset(); calls = shuffle(PATIENTS.slice()).slice(0, CALLS); callIdx = -1;
    $('title').classList.remove('show'); $('end').classList.remove('show'); nextCall();
  }
  function showMenu() { state = 'title'; ents = []; activeGate = null; score = 0; streak = 0; hearts = 3; calls = []; hideCard(); $('sheet').classList.remove('show'); $('end').classList.remove('show'); $('title').classList.add('show'); hud(); }
  // כל קריאה מתחילה בראש הפרוטוקול (ירושלים). לא עוצרים: המטופל מוצג בכרטיס בזמן שהכביש עוד ריק.
  const goCity = (dir, i) => { cityNow = i; gfx.turn(dir, i); };
  function nextCall() {
    callIdx++; if (callIdx >= calls.length) return endGame(true);
    patient = calls[callIdx]; nodeKey = ORDER[0]; trail = []; callLog = { p: patient, steps: [], end: '' }; log.push(callLog);
    ents = []; lane = 1; activeGate = null; dash = false; state = 'run';
    if (callIdx === 0) { cityNow = 0; gfx.setTheme(0); } else if (cityNow !== 0) goCity(0, 0);
    spawnSegment(); hud();
    $('card').className = 'pr-card show ok intro'; $('note').hidden = false; $('tag').textContent = `קריאה ${callIdx + 1} מתוך ${calls.length}:`; $('finding').textContent = `${patient.who}. ${patient.brief}`; cardTimer = 6.2;
    beep(523, .1, 'triangle'); beep(784, .14, 'triangle', .07, .1);
  }

  // הצומת הנוכחי: ברמה המודרכת עונים על השאלה שלו; ברמות השליפה בוחרים איזה שלב בא עכשיו בפרוטוקול
  function junction() {
    const key = nodeKey, n = NODES[key], p = patient;
    if (level === 0) {
      const opts = n.yn ? [{ t: 'כן', ok: p.ans[key] }, { t: 'לא', ok: !p.ans[key] }] : n.opts(p);
      return { tag: 'ממצא:', note: p.find[key] || n.find || p.brief, q: n.q || n.name, opts };
    }
    // המסיחים הם השלבים הסמוכים בתרשים: קודם אלה שבאים אחריו (פיתוי לדלג), ואם אין — אלה שלפניו
    const i = ORDER.indexOf(key), near = [];
    for (const k of [ORDER[i + 1], ORDER[i + 2], ORDER[i - 1], ORDER[i - 2]]) if (k && near.length < 2) near.push(k);
    return { tag: 'המטופל:', note: level === 1 ? p.brief : '', q: 'מה השלב הבא בפרוטוקול?', opts: [{ t: n.short, ok: true }, ...near.map(k => ({ t: NODES[k].short }))] };
  }
  const reveal = key => { const n = NODES[key]; return n.yn ? (patient.ans[key] ? n.yes : n.no) : n[patient.o2] || n.ok; };

  function makeGate(z) {
    const j = junction(), opts = [null, null, null];
    const lanes = j.opts.length === 2 ? shuffle([0, 2]) : shuffle([0, 1, 2]);
    const colors = shuffle(LANE_COLORS.slice());
    j.opts.forEach((o, k) => { opts[lanes[k]] = { label: o.t, ok: !!o.ok, color: colors[k] }; });
    return { type: 'gate', z, key: nodeKey, j, opts, shown: false, resolved: false, open: -1 };
  }
  function spawnSegment() {
    const base = trail.length === 0 ? 42 : 22;   // בתחילת קריאה משאירים כביש ריק כדי לקרוא על המטופל
    let l = rnd(3), kind = KINDS[rnd(4)];
    for (let k = 0; k < 6; k++) { if (k === 3) { l = (l + 1 + rnd(2)) % 3; kind = KINDS[(KINDS.indexOf(kind) + 1 + rnd(3)) % 4]; } ents.push({ type: 'orb', kind, lane: l, z: base + k * 3.2 }); }
    ents.push({ type: 'cone', lane: (l + 1 + rnd(2)) % 3, z: base + 12 });
    ents.push(makeGate(base + 16 + SHOW_Z)); // הצומת מתגלה רק אחרי שהדרך התפנתה
    speed = Math.min(9.8, 8 + answered * .12) * (level === 2 ? 1.2 : 1);
  }
  function spawnFinish() {
    for (let k = 0; k < 8; k++) ents.push({ type: 'orb', kind: KINDS[k % 4], lane: 1, z: 14 + k * 3.5 });
    ents.push({ type: 'hosp', z: 62 });
    state = 'finish';
  }

  function hud() {
    $('hearts').innerHTML = [0, 1, 2].map(i => `<span class="${i < hearts ? '' : 'lost'}">♥</span>`).join('');
    $('dots').innerHTML = calls.map((_, i) => `<i class="${i < callIdx ? 'ok' : i === callIdx && state !== 'title' ? 'cur' : ''}"></i>`).join('');
    $('score').textContent = score; $('home').hidden = state === 'title' || state === 'done';
    const m = Math.min(3, streak); $('streak').textContent = 'רצף ×' + m; $('streak').classList.toggle('on', m >= 2);
  }
  function showCard(g) {
    activeGate = g; cardTimer = 0; lastMeters = -1;
    $('card').className = 'pr-card show'; $('tag').textContent = g.j.tag; $('note').hidden = !g.j.note; $('hint').hidden = answered > 0;   // הנחיית הזינוק מוצגת רק בצומת הראשון
    $('finding').textContent = g.j.note; $('question').textContent = g.j.q;
    $('chips').innerHTML = g.opts.map((o, l) => o ? `<div class="${o.label.length <= 3 ? 'short' : ''}" style="--c:${o.color}"><i>${'←↑→'[l]}</i>${flatten(o.label)}</div>` : '<div class="blocked">חסום</div>').join('');
    beep(660, .05, 'square', .03);
  }
  function okCard(text) { $('card').className = 'pr-card show ok'; $('note').hidden = false; $('tag').textContent = 'לפי הפרוטוקול:'; $('finding').textContent = text; cardTimer = 2.8; }
  function hideCard() { $('card').className = 'pr-card'; cardTimer = 0; }
  function floater(text, color) { const d = document.createElement('div'); d.className = 'floater'; d.textContent = text; d.style.color = color; stage.appendChild(d); setTimeout(() => d.remove(), 950); }

  function resolveGate(g) {
    const n = NODES[g.key], cur = clamp(Math.round(px / LW) + 1, 0, 2), opt = g.opts[cur], right = g.opts.find(o => o && o.ok);
    g.resolved = true; activeGate = null; dash = false; answered++;
    if (opt && opt.ok) {
      streak++; const gain = 100 * Math.min(3, streak); score += gain; callLog.steps.push({ key: g.key, ok: true }); g.open = cur;
      gfx.sparks(cur - 1, 2.2, opt.color, 140, 15); floater('+' + gain, '#22C55E'); flash = { c: [.13, .77, .37], a: .3 };
      beep(523, .09, 'triangle'); beep(659, .09, 'triangle', .07, .08); beep(784, .16, 'triangle', .07, .16);
      proceed(g.key, cur - 1);
    } else {
      streak = 0; hearts--; callLog.steps.push({ key: g.key, ok: false }); shake = 16; flash = { c: [.94, .14, .24], a: .8 };
      gfx.sparks(cur - 1, 1.6, '#EF233C', 70, 11); beep(160, .25, 'sawtooth', .09); beep(110, .3, 'sawtooth', .08, .1);
      hideCard(); state = 'explain'; pendingKey = g.key; pendingDir = g.opts.indexOf(right) - 1;
      $('sheetTitle').textContent = opt ? '✗ לא לפי הפרוטוקול' : '✗ לא בחרת נתיב';
      $('sheetChose').textContent = opt ? flatten(opt.label) : 'הנתיב החסום';
      $('sheetRight').textContent = flatten(right.label);
      $('sheetWhy').textContent = level === 0 ? `${n.rule} הממצא כאן: ${g.j.note}`
        : `${trail.length ? 'הסדר עד כאן: ' + trail.join(' ← ') + '.' : 'זו תחילת הפרוטוקול.'} השלב הבא הוא "${n.name}". ${n.rule}`;
      $('sheetBtn').textContent = hearts > 0 ? 'הבנתי, ממשיכים' : 'לסיכום';
      $('sheet').classList.add('show');
    }
    hud();
  }
  // ממשיכים לפי התרשים: צומת נוסף, יציאה לפרוטוקול אחר, או פינוי לבית החולים
  function proceed(key, dir) {
    const n = NODES[key], nx = NEXT[key](patient.ans[key]); trail.push(n.name.replace('?', ''));
    okCard((level > 0 && n.yn ? n.name + ' ' : '') + reveal(key));
    if (nx[0] === '>') { callLog.end = nx.slice(1); goCity(dir, 0); state = 'handoff'; handoffT = 3; }   // הפנייה כבר מחזירה לראש הפרוטוקול, לקריאה הבאה
    else if (nx === 'hosp') { callLog.end = 'בית החולים'; goCity(dir, NODES.evac.city); spawnFinish(); }
    else { nodeKey = nx; goCity(dir, NODES[nx].city); spawnSegment(); }
  }
  function closeSheet() {
    if (state !== 'explain') return;
    $('sheet').classList.remove('show');
    if (hearts <= 0) return endGame(false);
    state = 'run'; proceed(pendingKey, pendingDir);
  }
  function endGame(won) {
    state = 'done'; hideCard(); ents = [];
    const steps = log.flatMap(c => c.steps), correct = steps.filter(s => s.ok).length, ratio = steps.length ? correct / steps.length : 0;
    const stars = !won ? 0 : ratio === 1 ? 3 : ratio >= .75 ? 2 : 1;
    $('endTitle').textContent = won ? 'המשמרת הסתיימה' : 'נגמרו הלבבות — ננסה שוב';
    $('endStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('');
    $('endScore').textContent = score; $('srcName').textContent = PROTOCOLS[proto].title;
    $('endSmall').textContent = `${correct} מתוך ${steps.length} החלטות נכונות, ברמת ${LEVELS[level].name}`;
    // לכל מטופל: המסלול שעבר בתרשים, עם סימון השלבים שבהם טעית
    $('recap').innerHTML = log.map(c => { const clean = c.steps.every(s => s.ok);
      const path = c.steps.map(s => `<span class="${s.ok ? '' : 'miss'}">${NODES[s.key].name}</span>`).concat(c.end ? [c.end] : []).join(' ← ');
      return `<li class="${clean ? 'ok' : 'bad'}"><b>${clean ? '✓' : '✗'}</b><span><strong>${c.p.who}</strong><br>${path}</span></li>`; }).join('');
    $('end').classList.add('show'); hud();
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
  $('startBtn').onclick = start; $('againBtn').onclick = start; $('menuBtn').onclick = showMenu; $('sheetBtn').onclick = closeSheet; $('home').onclick = showMenu;

  function update(dt) {
    T += dt; vNow = 0;
    const moving = state === 'run' || state === 'title' || state === 'finish' || state === 'handoff';
    if (moving) {
      slow = Math.max(0, slow - dt);
      // אזור החלטה: הדרך ריקה והזמן מאט כדי שאפשר יהיה לקרוא. זינוק מקצר את ההמתנה.
      const k = activeGate ? (dash ? 3 : level === 2 ? .7 : .5) : slow > 0 ? .55 : 1, v = state === 'title' ? 6 : speed * k;
      vNow = v; dist += v * dt;
      if (state !== 'title') for (const e of ents) e.z -= v * dt;
      if (cardTimer > 0 && (cardTimer -= dt) <= 0 && !activeGate) hideCard();
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
          if (e.shown && !e.resolved) { const m = Math.max(0, Math.round(e.z * 3 / 5) * 5); if (m !== lastMeters) { lastMeters = m; $('timerBar').textContent = m; } if (e.z <= .4) { resolveGate(e); break; } }
        }
        else if (e.type === 'hosp' && e.z <= 6) { const last = callIdx >= calls.length - 1; if (!last) goCity(0, 0); state = 'handoff'; handoffT = last ? 1.4 : .65; speed = 1.5; break; }   // הגענו לבית החולים — הקריאה הסתיימה
      }
      ents = ents.filter(e => !e.dead && e.z > -3);
    }
    if (state === 'handoff' && (handoffT -= dt) <= 0) nextCall();
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
    const SKY = {}; SKY.jlm = (c, w, h) => {
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
    };
    // קווי רקיע של שאר הערים. skyBase הוא קו האופק; מתחתיו הכול נמס באובך.
    const skyBase = 250, haze = (c, w, h) => { c.fillStyle = '#' + FOG.getHexString(); c.fillRect(0, skyBase - 2, w, h - skyBase + 2); };
    const lcg = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
    const ridge = (c, w, col, y0, amp, f, jag = 0, seed = 5) => { const r = lcg(seed); c.fillStyle = col; c.beginPath(); c.moveTo(0, skyBase);
      for (let x = 0; x <= w; x += 14) c.lineTo(x, y0 - Math.sin(x * f + seed) * amp - Math.sin(x * f * 3.1 + 2) * amp * .35 - r() * jag); c.lineTo(w, skyBase); c.fill(); };
    SKY.tlv = (c, w, h) => { const r = lcg(23);                                                               // הים בצד שמאל, המגדלים בימין
      c.fillStyle = '#c9a9a4'; for (let x = 820; x < w; x += 16 + r() * 22) { const bh = 14 + r() * 40; c.fillRect(x, skyBase - bh, 12 + r() * 16, bh); }
      c.fillStyle = '#8f7f98'; for (let x = 900; x < w; x += 46 + r() * 60) { const bh = 50 + r() * 110; c.fillRect(x, skyBase - bh, 24 + r() * 26, bh); }
      c.fillStyle = '#7a86a8'; c.fillRect(1260, skyBase - 168, 46, 168); c.beginPath(); c.ellipse(1283, skyBase - 168, 23, 7, 0, 0, 7); c.fill();   // עזריאלי: עגול, משולש, מרובע
      c.beginPath(); c.moveTo(1322, skyBase); c.lineTo(1322, skyBase - 176); c.lineTo(1352, skyBase - 150); c.lineTo(1352, skyBase); c.fill();
      c.fillRect(1368, skyBase - 150, 44, 150);
      c.fillStyle = 'rgba(255,236,200,.5)'; for (let y = skyBase - 160; y < skyBase - 6; y += 9) { c.fillRect(1264, y, 38, 2); c.fillRect(1372, y, 36, 2); }
      haze(c, w, h); };
    SKY.haifa = (c, w, h) => { const r = lcg(31);                                                             // הכרמל בשמאל, הנמל והים בימין
      c.fillStyle = '#c9a495'; c.beginPath(); c.moveTo(0, skyBase); c.lineTo(0, 96); c.bezierCurveTo(500, 70, 900, 150, 1500, 236); c.lineTo(1500, skyBase); c.fill();
      c.fillStyle = '#a98478'; for (let i = 0; i < 150; i++) { const x = r() * 1300, top = 96 + x * .1, y = top + 14 + r() * (skyBase - top - 30); c.fillRect(x, y, 7 + r() * 9, 5 + r() * 8); }
      c.fillStyle = '#7f9a62'; c.beginPath(); c.moveTo(560, 118); c.lineTo(640, 124); c.lineTo(690, skyBase); c.lineTo(520, skyBase); c.fill();       // הגנים הבהאיים
      c.strokeStyle = '#e9dcc0'; c.lineWidth = 2; for (let y = 132; y < skyBase; y += 13) { c.beginPath(); c.moveTo(556 - (y - 118) * .3, y); c.lineTo(644 + (y - 118) * .36, y); c.stroke(); }
      c.fillStyle = '#efe6d2'; c.fillRect(582, 178, 40, 16); c.fillStyle = '#f2c23e'; c.beginPath(); c.ellipse(602, 178, 15, 19, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#8a8fa6'; c.fillRect(1010, skyBase - 120, 24, 120);                                                                             // מגדל המפרש
      c.strokeStyle = '#a05a4a'; c.lineWidth = 4; for (const x of [1250, 1330, 1410]) { c.beginPath(); c.moveTo(x, skyBase); c.lineTo(x, skyBase - 54); c.lineTo(x + 44, skyBase - 66); c.moveTo(x - 14, skyBase - 54); c.lineTo(x + 20, skyBase - 54); c.stroke(); }
      c.fillStyle = '#8f7f98'; for (const x of [1620, 1840]) { c.fillRect(x, skyBase - 10, 90, 10); c.fillRect(x + 60, skyBase - 22, 20, 12); }    // אוניות
      haze(c, w, h); };
    SKY.tiberias = (c, w, h) => { ridge(c, w, '#cfa596', 204, 5, .0021, 3, 9); ridge(c, w, '#b98f88', 222, 4, .004, 2, 4); haze(c, w, h); };          // רמת הגולן מעבר לכנרת
    SKY.negev = (c, w, h) => { ridge(c, w, '#dcae7e', 196, 16, .0031, 0, 3); ridge(c, w, '#c58f5f', 222, 10, .0052, 0, 8);
      c.fillStyle = '#6e4a36'; for (const [x, k] of [[620, 1], [700, .85], [770, 1.05]]) { c.save(); c.translate(x, 214); c.scale(k, k);              // גמלים
        c.beginPath(); c.ellipse(0, 0, 22, 10, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(-2, -10, 9, 8, 0, 0, 7); c.fill();
        for (const lx of [-16, -6, 8, 16]) c.fillRect(lx, 4, 4, 22); c.fillRect(18, -24, 5, 24); c.fillRect(18, -28, 14, 7); c.restore(); }
      c.fillRect(1396, 180, 6, 44); c.beginPath(); c.ellipse(1399, 178, 44, 10, 0, 0, 7); c.fill();                                                   // שיטה
      haze(c, w, h); };
    SKY.deadsea = (c, w, h) => { ridge(c, w, '#d4a9a6', 168, 12, .0024, 6, 6);                                                                         // הרי מואב ומצדה
      c.fillStyle = '#b07f6c'; c.beginPath(); c.moveTo(150, skyBase); c.lineTo(260, 142); c.lineTo(640, 138); c.lineTo(780, skyBase); c.fill();
      c.fillStyle = '#9a6c5c'; c.fillRect(330, 130, 60, 9); c.fillRect(470, 128, 34, 11);
      haze(c, w, h); };
    SKY.eilat = (c, w, h) => { ridge(c, w, '#d59c86', 150, 26, .0046, 22, 12); ridge(c, w, '#b0614f', 190, 22, .0071, 26, 2); ridge(c, w, '#8f4a40', 226, 9, .011, 12, 7); haze(c, w, h); };   // הרי אילת האדומים
    const skyCache = {};
    function skylineFor(kind) { if (!skyCache[kind]) { const t = canvasTex(2048, 320, SKY[kind]); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; skyCache[kind] = t; } return skyCache[kind]; }
    const skyline = new THREE.Mesh(new THREE.PlaneGeometry(2400, 375), new THREE.MeshBasicMaterial({ map: skylineFor('jlm'), alphaTest: .5, depthTest: false, depthWrite: false, fog: false }));
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
      fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSun: { value: SUN }, uStone: { value: new THREE.Color(.72, .57, .36) }, uStyle: { value: 0 } }]),
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
        uniform vec3 uSun, uStone; uniform float uStyle; varying vec2 vWin; varying float vSeed; varying vec3 vN;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float box(vec2 p, vec2 b){ return step(abs(p.x), b.x) * step(abs(p.y), b.y); }
        void main(){
          // uStyle: 0 אבן ירושלמית · 1 טיח לבן (תל אביב, חיפה) · 2 בזלת (טבריה) · 3 בית מדברי · 4 מלון זכוכית (אילת)
          vec3 wall = uStone * (.9 + .22 * fract(vSeed * 7.3));
          if (uStyle < .5 || (uStyle > 1.5 && uStyle < 2.5)) wall *= 1. - .07 * step(.9, fract(vWin.y / .55)) - .05 * h21(floor(vWin / vec2(1.1, .55)));   // נדבכי אבן
          vec3 light = vec3(1., .7, .4) * 1.75 * max(dot(vN, uSun), 0.) + vec3(.42, .43, .56) + vec3(.25, .16, .1) * max(vN.y, 0.);
          vec3 col = wall * light;
          if (abs(vN.y) < .5) {
            vec2 cell = vec2(2.7, 3.2);
            if (uStyle > 3.5) cell = vec2(2., 3.); else if (uStyle > .5 && uStyle < 1.5) cell = vec2(4.2, 3.2);
            vec2 g = vWin / cell, id = floor(g), p = (fract(g) - vec2(.5, .58)) * cell;
            float r = h21(id + vSeed * 17.), up = step(1., id.y), win = 0., trim = 0.;
            if (uStyle < .5) win = box(p + vec2(0., .625), vec2(.5, .625)) + step(length(p), .5) * step(0., p.y);                 // חלון מקושת
            else if (uStyle < 1.5) { win = box(p, vec2(1.75, .55)) * step(.1, fract(p.x / 1.1 + .5)); trim = box(p + vec2(0., .9), vec2(2.1, .1)); }   // חלונות סרט ומרפסת
            else if (uStyle < 2.5) { win = box(p, vec2(.5, .8)); trim = box(p, vec2(.68, .98)) - win; }                              // מסגרת אבן בהירה
            else if (uStyle < 3.5) win = box(p, vec2(.42, .42)) * step(.35, r);                                                       // חלונות קטנים ודלילים
            else { win = box(p, vec2(.86, 1.15)); trim = box(p + vec2(0., .95), vec2(1., .08)); }                                      // קיר זכוכית ומעקה
            win = min(win, 1.) * up; trim = clamp(trim, 0., 1.) * up;
            vec3 glass = vec3(.07, .09, .13) + vec3(1., .62, .3) * .75 * step(.72, r) * max(dot(vN, uSun) + .25, 0.) + vec3(1., .8, .45) * .8 * step(.93, r);
            if (uStyle > 3.5) glass += vec3(.1, .22, .34);
            vec3 trimCol = col * .72; if (uStyle > 1.5 && uStyle < 2.5) trimCol = vec3(.92, .9, .84) * light;
            col = mix(col, trimCol, trim);
            col = mix(col, glass, win);
            col *= 1. - .22 * step(vWin.y, 3.1) * step(.5, fract(vWin.x / 5.4 + vSeed));                                              // פתחי חנויות בקומת הקרקע
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

    // ── אתרים של שאר הערים ──
    const glassMat = lam(0x9fc4e8, { emissive: 0x1f3a52 }), goldMat = lam(0xf2c23e, { emissive: 0x6b4a00 });
    const cyl = (mat, rt, rb, hgt, seg, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, hgt, seg), mat); m.position.set(x, y, z); return m; };
    const RED = 0xd0452c, WOOD = 0x8a5a36, CAMEL = 0xb98a55;
    const LM2 = {
      azrieli: landmark(1, 44, 'מגדלי עזריאלי', g => { g.add(cyl(glassMat, 6.5, 6.5, 62, 20, 21, 31, -10), cyl(glassMat, 8, 8, 68, 3, 33, 34, 2), boxes(glassMat, [[21, 27, 12, 11, 54, 11]]), boxes(whiteMat, [[25, 2, 1, 26, 4, 40]])); }),
      beach: landmark(-1, 0, 'חוף הים', g => {
        const list = [[-17, 2.6, -12, 2.8, 1.8, 2.8, 0xf4f1ea], [-17, .85, -12, 2.2, 1.7, 2.2, WOOD]];
        [0xc8102e, 0x2d6cb5, 0xf2b632, 0x2f8f4e].forEach((c, i) => { const x = -15 - (i % 2) * 5, z = -2 + i * 6; list.push([x, 1.1, z, .1, 2.2, .1, 0x4a4640]); const u = new THREE.Mesh(new THREE.ConeGeometry(1.7, .7, 8), lam(c)); u.position.set(x, 2.5, z); g.add(u); });
        g.add(boxes(tintMat, list)); }),
      bahai: landmark(-1, 34, 'הגנים הבהאיים', g => {
        const list = []; for (let k = 0; k < 6; k++) list.push([-13.5 - k * 3.2, (k + 1) * .8, 0, 3.2, (k + 1) * 1.6, 28 - k * 2, k % 2 ? 0x6f9a55 : 0x86ab66]);
        list.push([-35.5, 11.6, 0, 9, 4, 9, 0xefe6d2]); g.add(boxes(tintMat, list), cyl(whiteMat, 3.2, 3.2, 3, 12, -35.5, 15.1, 0));
        const dome = new THREE.Mesh(new THREE.SphereGeometry(3.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), goldMat); dome.scale.y = 1.25; dome.position.set(-35.5, 16.6, 0); g.add(dome); }),
      crane: landmark(1, 0, 'נמל חיפה', g => { g.add(boxes(tintMat, [[18, 9, -5, .8, 18, .8, RED], [18, 9, 5, .8, 18, .8, RED], [24, 9, -5, .8, 18, .8, RED], [24, 9, 5, .8, 18, .8, RED], [21, 18.4, 0, 8, 1, 12, RED], [27, 20, 0, 26, 1, 1.4, RED], [21, 23, 0, 1, 6, 1, RED],
        [31, 1.3, -10, 6, 2.6, 2.5, 0x2d6cb5], [31, 1.3, -6.5, 6, 2.6, 2.5, 0xf2b632], [31, 3.9, -8.5, 6, 2.6, 2.5, 0xc8102e]])); }),
      boat: landmark(-1, 0, 'הכנרת', g => { g.add(boxes(tintMat, [[-21, .5, 0, 21, .3, 2.4, WOOD], [-36, .9, 6, 3.4, 1.4, 10, WOOD], [-36, 2.2, 7, 2.4, 1.3, 4, 0xf4f1ea], [-36, 4.6, 4.5, .16, 6, .16, 0x4a4640]])); }),
      tent: landmark(1, 26, 'מאהל בדואי', g => { g.add(boxes(tintMat, [[18, 1.5, 2, 10, 3, 15, 0x3a2e28], [18, 3.15, 2, 11, .3, 16, 0x574236], [12.6, 1.5, -4, .15, 3, .15, WOOD], [12.6, 1.5, 8, .15, 3, .15, WOOD],
        [14, 2, -11, 1.1, 1.3, 2.6, CAMEL], [14, 2.9, -11.2, .9, .7, 1, CAMEL], [13.7, .7, -10, .25, 1.4, .25, CAMEL], [14.3, .7, -10, .25, 1.4, .25, CAMEL], [13.7, .7, -12, .25, 1.4, .25, CAMEL], [14.3, .7, -12, .25, 1.4, .25, CAMEL], [14, 3, -12.6, .3, 1.8, .3, CAMEL], [14, 3.9, -13, .45, .4, .9, CAMEL]])); }),
      salt: landmark(1, 0, 'המקום הנמוך בעולם', g => { const list = []; for (let k = 0; k < 9; k++) list.push([13 + hash(k) * 9, .5 + hash(k + 9) * .9, -14 + k * 3.4, 1 + hash(k + 3) * 1.6, 1 + hash(k + 9) * 1.8, 1 + hash(k + 5) * 1.6]); g.add(boxes(whiteMat, list)); }),
      marina: landmark(-1, 0, 'המרינה של אילת', g => {
        g.add(boxes(tintMat, [[-30, 1, -4, 3.2, 1.6, 11, 0xf4f1ea], [-30, 2.3, -3, 2.2, 1, 4.5, 0xdfe3e8], [-30, 7, -5, .14, 10, .14, 0x4a4640], [-20, .5, 8, 19, .3, 2.2, WOOD]]), cyl(whiteMat, 1.3, 1.6, 12, 12, -38, 6, 12), cyl(glassMat, 3, 2.2, 2.4, 12, -38, 13, 12));
        const sail = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8.5, 3), whiteMat); sail.scale.z = .08; sail.position.set(-30, 7.2, -3.4); g.add(sail); }),
    };

    // דקלים וים — מופיעים רק בערים שיש בהן
    const palmTrunk = inst(new THREE.CylinderGeometry(.14, .22, 6.4, 6), lam(0x8a6a4a), TREE_N * 2), palmCrown = inst(new THREE.ConeGeometry(2.1, 1.5, 7), lam(0x5f8a45), TREE_N * 2);
    const seaTex = canvasTex(64, 256, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,${200 + Math.random() * 40 | 0},${150 + Math.random() * 60 | 0},${.15 + Math.random() * .35})`; c.fillRect(Math.random() * w, Math.random() * h, 6 + Math.random() * 22, 1.5); } });
    seaTex.repeat.set(10, ROAD_LEN / 40);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(320, ROAD_LEN), lam(0x3f8fb5, { map: seaTex, emissive: 0x123a52 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, .02, zMid); sea.visible = false; scene.add(sea);

    // ── ערים: כל פנייה בצומת מחליפה את הנוף ──
    const THEMES = [
      { name: 'ירושלים', sky: 'jlm', fog: 0xf3be8e, mid: 0xeda39a, top: 0x4a76b8, stone: [.72, .57, .36], style: 0, floors: [3, 4], density: 1, sea: 0, palm: false, tanks: true, ground: 0xb39a72, walk: 0xd7c097, lm: [LM[1], LM[4], LM[3], LM[2], LM[0]] },
      { name: 'תל אביב', sky: 'tlv', fog: 0xf5c9a2, mid: 0xf0aea0, top: 0x4687c9, stone: [.84, .82, .76], style: 1, floors: [3, 5], density: 1, sea: -1, seaColor: 0x3f93c0, palm: true, tanks: true, ground: 0xe6cf9f, walk: 0xcfc7b8, lm: [LM2.azrieli, LM2.beach] },
      { name: 'חיפה', sky: 'haifa', fog: 0xf0c4a4, mid: 0xe9a9a4, top: 0x4c7dbd, stone: [.78, .7, .58], style: 1, floors: [3, 5], density: 1, sea: 1, seaColor: 0x3a86b4, palm: false, tanks: true, ground: 0xc9b48a, walk: 0xcfc2a8, lm: [LM2.bahai, LM2.crane] },
      { name: 'טבריה', sky: 'tiberias', fog: 0xecbc9e, mid: 0xe6a59c, top: 0x4f7fb8, stone: [.2, .2, .23], style: 2, floors: [2, 3], density: .9, sea: -1, seaColor: 0x4a8fae, palm: true, tanks: false, ground: 0xb9a37c, walk: 0x8f8a84, lm: [LM2.boat] },
      { name: 'באר שבע', sky: 'negev', fog: 0xf2c38c, mid: 0xeeb08e, top: 0x5a86bd, stone: [.8, .64, .42], style: 3, floors: [1, 3], density: .55, sea: 0, palm: true, tanks: true, ground: 0xdcb37a, walk: 0xd9bd8c, lm: [LM2.tent] },
      { name: 'ים המלח', sky: 'deadsea', fog: 0xf3cdb0, mid: 0xecb3a6, top: 0x5f8cc0, stone: [.86, .8, .7], style: 3, floors: [1, 2], density: .15, sea: 1, seaColor: 0x57c4c4, palm: true, tanks: false, ground: 0xead9bd, walk: 0xe6dccb, lm: [LM2.salt] },
      { name: 'אילת', sky: 'eilat', fog: 0xf4b78e, mid: 0xee9e92, top: 0x3f6fb8, stone: [.9, .88, .84], style: 4, floors: [4, 5], density: 1, sea: -1, seaColor: 0x2f7fc0, palm: true, tanks: false, ground: 0xe3c08e, walk: 0xd8cdbb, lm: [LM2.marina] },
    ];
    const ALL_LM = LM.concat(Object.values(LM2));
    let TH = THEMES[0], curD = 0, lmD0 = 0, turn = null;
    const fadeEl = document.createElement('div');
    fadeEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0'; vigEl.after(fadeEl);
    function applyTheme(i) {
      TH = THEMES[((i % THEMES.length) + THEMES.length) % THEMES.length]; lmD0 = curD;
      FOG.set(TH.fog); skyMat.uniforms.uMid.value.set(TH.mid); skyMat.uniforms.uTop.value.set(TH.top); skyline.material.map = skylineFor(TH.sky);
      bldMat.uniforms.uStone.value.setRGB(TH.stone[0], TH.stone[1], TH.stone[2]); bldMat.uniforms.uStyle.value = TH.style;
      ground.material.color.set(TH.ground); walkMat.color.set(TH.walk);
      sea.visible = TH.sea !== 0; if (TH.sea) { sea.position.x = TH.sea * 182; sea.material.color.set(TH.seaColor); }
      trees.visible = !TH.palm; palmTrunk.visible = palmCrown.visible = TH.palm;
      fadeEl.style.background = '#' + FOG.getHexString();
    }
    applyTheme(0);

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
    // ── צומת: כביש חוצה, מעבר חצייה, חץ על כל נתיב ושלט כיוון לכל תשובה ──
    function arrowPath(c, cx, cy, size, dir) { c.save(); c.translate(cx, cy); c.rotate(dir * Math.PI / 2); c.beginPath(); for (const [x, y] of [[0, -.5], [.4, -.05], [.15, -.05], [.15, .5], [-.15, .5], [-.15, -.05], [-.4, -.05]]) c.lineTo(x * size, y * size); c.closePath(); c.fill(); c.restore(); }
    const arrowTex = [-1, 0, 1].map(d => canvasTex(128, 256, (c, w, h) => { c.fillStyle = '#fff'; arrowPath(c, w / 2, h / 2, d ? 120 : 210, d); }));
    function signTex(lines, color, dir) {
      return canvasTex(512, 384, (c, w, h) => {
        c.fillStyle = '#000'; c.beginPath(); c.roundRect(2, 2, w - 4, h - 4, 26); c.fill(); c.fillStyle = color; c.beginPath(); c.roundRect(14, 14, w - 28, h - 28, 16); c.fill();
        c.fillStyle = '#000'; arrowPath(c, w / 2, 98, 132, dir);
        c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
        let fs = Math.min(120, 190 / lines.length / 1.1);
        for (;;) { c.font = `400 ${fs}px ${FONT}`; if (Math.max(...lines.map(l => c.measureText(l).width)) <= w - 70 || fs < 20) break; fs -= 4; }
        lines.forEach((l, i) => c.fillText(l, w / 2, 268 + (i - (lines.length - 1) / 2) * fs * 1.1));
      });
    }
    const zebraTex = canvasTex(64, 16, (c, w, h) => { c.fillStyle = '#f4f1e8'; c.fillRect(0, 0, w / 2, h); }); zebraTex.repeat.set(12, 1);
    const crossMat = lam(0x8b867f), zebraMat = new THREE.MeshBasicMaterial({ map: zebraTex, transparent: true, opacity: .85, depthWrite: false });
    const flat = (w, d) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); return g; };
    const crossG = flat(170, 15), zebraG = flat(ROAD_HALF * 2 - 1, 2.6), laneArrowG = flat(1.7, 4.2);
    const GH = 4.6, signG = new THREE.PlaneGeometry(LANE - .12, 2.3);
    function buildGate(g) {
      const grp = new THREE.Group(); grp.userData = { lanes: [], tex: [] };
      const cross = new THREE.Mesh(crossG, crossMat); cross.position.set(0, .035, -10.5); const zebra = new THREE.Mesh(zebraG, zebraMat); zebra.position.set(0, .05, -1.4); grp.add(cross, zebra);
      const beam = new THREE.Mesh(boxG, gantryMat); beam.scale.set(LANE * 3 + 1.4, .22, .22); beam.position.y = GH + 2.45; grp.add(beam);
      for (const sd of [-1, 1]) { const col = new THREE.Mesh(boxG, gantryMat); col.scale.set(.22, GH + 2.5, .22); col.position.set(sd * (LANE * 1.5 + .6), (GH + 2.5) / 2, 0); grp.add(col); }
      g.opts.forEach((o, l) => {
        const x = (l - 1) * LANE;
        if (!o) {   // הכיוון הזה סגור
          const bar = new THREE.Mesh(boxG, new THREE.MeshBasicMaterial({ map: hazardTex })); bar.scale.set(LANE - .3, .75, .22); bar.position.set(x, 1, -2.6); grp.add(bar);
          for (const sd of [-1, 1]) { const leg = new THREE.Mesh(boxG, gantryMat); leg.scale.set(.12, 1.3, .12); leg.position.set(x + sd * 1.3, .65, -2.6); grp.add(leg); }
          const t = textTex(['✕'], { w: 256, h: 192, color: '#ff4757', bg: 'rgba(8,9,18,.92)', max: 130 }); grp.userData.tex.push(t);
          const s = new THREE.Mesh(signG, new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); s.position.set(x, GH + 1.2, .05); grp.add(s);
        } else {
          const t = signTex(o.label.split('\n'), o.color, l - 1); grp.userData.tex.push(t);
          const sign = new THREE.Mesh(signG, new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); sign.position.set(x, GH + 1.2, .05); grp.add(sign);
          const a = new THREE.Mesh(laneArrowG, new THREE.MeshBasicMaterial({ map: arrowTex[l], color: o.color, transparent: true, depthWrite: false, toneMapped: false })); a.position.set(x, .06, 8); grp.add(a);
        }
        grp.userData.lanes.push([]);
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
    api.setTheme = i => { turn = null; fadeEl.style.opacity = 0; applyTheme(i); };
    api.turn = (dir, i) => { turn = { k: 0, dir, i, done: false }; };
    async function load() {
      try { await Promise.all([document.fonts.load("400 40px 'Secular One'", 'אב'), document.fonts.ready]); } catch (e) { /* נמשיך עם גופן המערכת */ }
      const erSign = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.2), new THREE.MeshBasicMaterial({ map: textTex(['מיון'], { w: 512, h: 128, color: '#ffffff', bg: '#d0142c', max: 100 }) })); erSign.position.set(0, 8, 5.1);
      const nameSign = new THREE.Mesh(new THREE.PlaneGeometry(17, 3.4), new THREE.MeshBasicMaterial({ map: textTex(['יוספטל'], { w: 640, h: 128, color: '#17324d', bg: '#f4f1ea', max: 96 }) })); nameSign.position.set(0, 18.5, -.9);
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
    let sizeW = 4, sizeH = 4, slowFrames = 0, probeFrames = 0;
    const probe = new Uint8Array(4);
    function skyIsBlack() {
      const gl = renderer.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight; let sum = 0;
      for (const fx of [.2, .5, .8]) { gl.readPixels(Math.floor(w * fx), Math.floor(h * .9), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, probe); sum += probe[0] + probe[1] + probe[2]; }
      return sum === 0;
    }
    api.resize = (w, h) => { sizeW = w; sizeH = h; resize(w, h); };

    let camX = 0, fov = 70, blur = 0, vig = 0, dashK = 0, susY = 0, susV = 0, lastLean = 0, pitch = 0, vSm = 0;
    const zones = [];
    api.render = (S, dt, rawDt) => {
      // איכות אדפטיבית: אם הקצב צונח, מורידים רזולוציה
      if (rawDt < .1) { slowFrames = rawDt > 1 / 45 ? slowFrames + 1 : Math.max(0, slowFrames - 2); if (slowFrames > 70 && pr > 1) { pr = Math.max(1, pr - .25); slowFrames = 0; resize(sizeW, sizeH); } }

      const v = S.v * ZS, D = S.dist * ZS, t = S.T; vSm = damp(vSm, v, 6, dt);
      const carX = S.px / LW * LANE, kSpeed = v / 24;
      roadMap.offset.y = D / 16 % 1; seaTex.offset.y = D / 40 % 1; curD = D;

      // ── ישויות (לפני הסביבה, כי בית החולים מפנה לעצמו מקום בין הבניינים) ──
      const seen = new Set(); let hospOn = false, gateActive = null; zones.length = 0;
      for (const e of S.ents) {
        if (e.type === 'hosp') { hospOn = true; hosp.position.set(0, 0, -e.z * ZS); zones.push([0, -e.z * ZS - 40, -e.z * ZS + 12]); continue; }
        let o = live.get(e); if (!o) { o = makeEnt(e); if (!o) continue; live.set(e, o); scene.add(o); }
        seen.add(e);
        if (e.type === 'gate') {
          o.position.set(0, 0, -e.z * ZS); zones.push([0, -e.z * ZS - 20, -e.z * ZS + 3]);   // הכביש החוצה פותח רווח בין הבניינים
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

      // ── אתרי העיר: הראשון מופיע קרוב אחרי הפנייה (האובך מסתיר את ההחלפה), ואחר כך הם חוזרים במחזור מרחוק ──
      for (const l of ALL_LM) l.g.visible = false;
      TH.lm.forEach((l, k) => { const z0 = -110 - k * 150 + (D - lmD0), z = z0 <= 80 ? z0 : -330 + ((z0 - 80) % 410); if (hospOn && z < hosp.position.z + 60) return; l.g.visible = true; l.g.position.z = z; if (l.len) zones.push([l.side, z - l.len / 2 - 5, z + l.len / 2 + 5]); });
      if (millSails) millSails.rotation.x = t * .5;
      const blocked = (sd, z0, z1) => { for (const q of zones) if ((q[0] === 0 || q[0] === sd) && z1 > q[1] && z0 < q[2]) return true; return false; };

      // ── סביבת הרחוב: בניינים, דודי שמש, ברושים ועמודי תאורה ──
      const bBase = Math.floor(D / BLD_S), bOff = D - bBase * BLD_S;
      [-1, 1].forEach((sd, si) => {
        for (let i = 0; i < BLD_N; i++) {
          const g = bBase + i, k = si * BLD_N + i, h1 = hash(g * 2 + si + 11.3), h2 = hash(g * 2 + si + 47.9), h3 = hash(g * 2 + si + 83.1);
          const w = 11 + h1 * 7, len = 13 + h2 * 3.5, ht = (TH.floors[0] + Math.floor(h3 * TH.floors[1])) * 3.2 + 1, z = 34 - i * BLD_S + bOff, x = sd * (10.5 + w / 2);
          if (TH.sea === sd || hash(g * 2 + si + 5.5) > TH.density || blocked(sd, z - len / 2, z + len / 2)) { put(blds, k, 0, -80, 0, .01, .01, .01); put(tanks, k, 0, -80, 0); put(panels, k, 0, -80, 0); continue; }
          put(blds, k, x, ht / 2, z, w, ht, len); bldSeed.array[k] = h1 * 100;
          if (TH.tanks) { const rx = x - sd * w * .22, rz = z + (h2 - .5) * len * .5; put(tanks, k, rx, ht + 1.25, rz); put(panels, k, rx, ht + .5, rz + 1.1); } else { put(tanks, k, 0, -80, 0); put(panels, k, 0, -80, 0); }
        }
        const tOff = (D + TREE_S / 2) % TREE_S;
        for (let i = 0; i < TREE_N; i++) { const z = 30 - i * TREE_S + tOff, s = .8 + hash(Math.floor((D + TREE_S / 2) / TREE_S) + i + si * 31.7) * .45; const q = si * TREE_N + i; put(trees, q, sd * 9.95, 3.5 * s + .2, z, 1, s, 1); put(palmTrunk, q, sd * 9.6, 3.2 * s, z, 1, s, 1); put(palmCrown, q, sd * 9.6, 6.4 * s + .45, z, s, s, s); }
        const pOff = (D + si * LAMP_S / 2) % LAMP_S;
        for (let i = 0; i < LAMP_N; i++) { const z = 28 - i * LAMP_S + pOff, k = si * LAMP_N + i; put(lampPole, k, sd * 6.75, 3.7, z); put(lampArm, k, sd * 5.9, 7.3, z, 1.9, .12, .3); }
      });
      for (const m of [blds, tanks, panels, trees, palmTrunk, palmCrown, lampPole, lampArm]) m.instanceMatrix.needsUpdate = true;
      bldSeed.needsUpdate = true;

      // ── האמבולנס: הטיה, סבסוב, מתלים, גלגלים, צ'קלקה ──
      const leanV = (S.lean - lastLean) / Math.max(dt, .001); lastLean = S.lean;
      susV += (-190 * susY - 13 * susV) * dt + Math.abs(leanV) * .0009 + (Math.random() - .5) * kSpeed * .13 * dt; susY += susV * dt;
      if (S.shake > 8.5 && susY > -.02) susV = -1.3;
      pitch = damp(pitch, clamp((v - vSm) * .012, -.07, .07), 8, dt);
      car.position.set(carX, 0, 0);
      // פנייה בצומת: האמבולנס מסתובב, המסך נמס לאובך, ומאחוריו מתחלפת העיר
      let tw = 0;
      if (turn) {
        turn.k += dt / 1.2; const k = Math.min(1, turn.k);
        if (k >= .5 && !turn.done) { turn.done = true; applyTheme(turn.i); }
        tw = Math.sin(Math.PI * k) * turn.dir; fadeEl.style.opacity = Math.min(1, 2.2 * (1 - Math.abs(2 * k - 1))).toFixed(2);
        if (k >= 1) { turn = null; fadeEl.style.opacity = 0; }
      }
      carBody.position.y = susY; carBody.rotation.set(-pitch, -S.lean * .2 - tw * .7, S.lean * .13 + tw * .12);
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
      camera.lookAt(camX * .9 + carX * .22 + tw * 9, 1.7, -17);
      sky.position.copy(camera.position);
      skyline.position.set(camera.position.x, camera.position.y + 100, camera.position.z - 950);
      sunGlow.position.copy(SUN).multiplyScalar(900).add(camera.position);

      // ── שכבות CSS ורינדור ──
      vig = damp(vig, gateActive ? .75 : .18, 4, dt); vigEl.style.opacity = vig.toFixed(2);
      if (S.flash) { flashEl.style.background = `radial-gradient(ellipse at 50% 46%, transparent 25%, rgba(${S.flash.c.map(x => Math.round(x * 255))},.95) 100%)`; flashEl.style.opacity = Math.min(1, S.flash.a).toFixed(2); } else flashEl.style.opacity = 0;
      if (composer) {
        blur = damp(blur, S.dash ? .11 : 0, 5, dt); fxPass.uniforms.uBlur.value = blur; fxPass.enabled = blur > .004; composer.render(dt);
        // רשת ביטחון: יש כרטיסי מסך שבהם ה־render target של הפוסט־פרוססינג יוצא שחור. אם השמיים שחורים — עוברים לרינדור ישיר.
        if (++probeFrames > 2 && probeFrames < 8 && skyIsBlack()) { console.warn('protocol-runner: post-processing output is black, falling back to direct rendering'); composer.dispose(); composer = null; renderer.render(scene, camera); }
      } else renderer.render(scene, camera);
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
  // שגיאת גרפיקה מוצגת על המסך, כדי שלא יישאר מסך שחור בלי הסבר
  function showError(msg) { let el = stage.querySelector('.pr-error'); if (!el) { el = document.createElement('div'); el.className = 'pr-error'; el.style.cssText = 'position:absolute;inset-inline:.8em;top:40%;padding:.8em;border-radius:.8em;background:rgba(40,8,14,.95);border:1px solid #EF233C;color:#fff;font-size:.8em;line-height:1.4;text-align:center;z-index:9;direction:ltr'; stage.appendChild(el); } el.textContent = 'שגיאת גרפיקה: ' + msg; }
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); if (!dead) showError('WebGL context lost'); });
  function frame(now) {
    // הפריים הראשון יכול להגיע עם חותמת זמן שקודמת ל־last, ואז raw שלילי — לכן חוסמים מלמטה באפס
    if (dead) return; const raw = Math.max(0, (now - last) / 1000), dt = Math.min(.05, raw); last = now;
    try { update(dt); draw(dt, raw); } catch (err) { console.error(err); showError(String(err && err.message || err)); return; }
    raf = requestAnimationFrame(frame);
  }
  hud(); raf = requestAnimationFrame(frame);

  // כלי בדיקה: מאפשר להריץ את הלוגיקה צעד־צעד מהקונסול
  if (import.meta.env.DEV) window.__prDbg = { update, draw, start, doDash, closeSheet, setLane: l => { lane = l; }, setLevel: l => { level = l; }, setProto: useProto, get s() { return { proto, state, score, hearts, stepIdx: answered, activeGate, ents, loaded: gfx.loaded, callIdx, nodeKey, level, patient, log }; } };

  return {
    destroy() {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', onKey);
      gfx.dispose(); if (AC) AC.close().catch(() => {});
      root.innerHTML = ''; root.classList.remove('pr-root');
    },
  };
}
