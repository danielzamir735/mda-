# תוכנית: מצב כהה/בהיר ותרגום לאנגלית בכל האפליקציה

## מה מצאתי (מצב נוכחי)

**מצב כהה/בהיר** – המנגנון עצמו תקין: `App.tsx` מוסיף/מסיר את המחלקה `dark` על `<html>`, ו־Tailwind מוגדר `darkMode: 'class'`. הבעיה היא שרוב המסכים נכתבו בצבעים קבועים של מצב כהה (`text-white`, `bg-white/10`, `rgba(255,255,255,0.3)` בתוך `style`), בלי גרסה ל־`dark:`. לכן בבהיר הם נשארים כהים או שהטקסט הלבן נעלם על רקע בהיר.

מסכים עם **אפס** מחלקות `dark:` ומלא צבעים קבועים (הכי שבורים):
`DailyChallengeModal` (3,501 שורות), `ContractionTimerModal`, `AfterCallModal`, `ConceptsModal`, `AbbreviationFlashcards`, `FlashcardTrainer`, `BreathingSynchronizer`, `ChildCalmScreen`, `SoulDepartureModal`, `MedicationScannerModal`, `CameraCapture`, `GalleryModal`, `FullInstallModal`, `UpdateAnnouncementModal`, `UpdateModal`, `MigrationBanner`, `AuthCard`, `SupportPage`.
מסכים עם כיסוי חלקי: `HubModal` (25 `dark:` מול 61 צבעים קבועים ו־94 צבעים ב־style), `LanguageBridgeModal` (32 מול 178, ו־139 ב־style), `CPRTimerOverlay` (86 ב־style).

**תרגום** – יש מילון אחד ב־`src/hooks/useTranslation.ts` (כ־100 מפתחות), אבל רק כ־12 קבצים משתמשים בו (מסך הבית: מדדים, מטרונום, פתקים, כלים מהירים, בתי חולים). **כ־65 קבצי מסך** כתובים בעברית קבועה בלי שום בדיקת שפה – כולל `SettingsModal` עצמו, `HubModal` (168 שורות עברית), `DailyChallengeModal` (144), `LanguageBridgeModal` (160).
בנוסף יש **קבצי תוכן רפואי** בעברית בלבד (`src/features/hub/data/*`, `legalContent.ts`, `cprProtocol.ts`) – כ־1,900 שורות.

**כיוון טקסט** – `App.tsx` כבר מחליף `dir` ל־`ltr` באנגלית, אבל יש כ־140 מקומות עם `ml-/mr-/left-/right-/text-right` שלא יתהפכו נכון.

---

## החלטה שצריך לקבל לפני שמתחילים

**האם לתרגם גם את התוכן הרפואי** (פרוטוקולים, מינונים, תרופות, חומ"ס, מילון מונחים, שאלות האתגר היומי שמגיעות מהשרת)?
- **המלצה:** בסבב הזה לתרגם רק את הממשק (כותרות, כפתורים, תוויות, הודעות). תוכן רפואי מתורגם דורש בדיקה של איש מקצוע – טעות במינון באנגלית מסוכנת. את התוכן אפשר לעשות בסבב נפרד אחר כך (סשן 10 למטה), עם בדיקה רפואית.
- **משפטי:** מדיניות פרטיות ותקנון באנגלית – גם זו החלטה נפרדת (אפשר להשאיר עברית עם שורה "The binding version is Hebrew").

---

## איך עובדים (כללים לכל הסשנים)

1. **צבעים:** לא מוסיפים `dark:` ליד כל צבע. סשן 0 מגדיר טוקנים סמנטיים (משתני CSS שמשתנים לפי `.dark`), וכל מסך עובר אליהם: `bg-surface`, `bg-surface-2`, `text-fg`, `text-fg-muted`, `border-line` וכו'. צבעי מצב (אדום/ירוק/כתום של התראות) נשארים – רק מוודאים ניגודיות בשני המצבים.
2. **צבעים בתוך `style={{...}}`:** מחליפים ב־`var(--fg-muted)` וכו', לא ב־rgba קבוע.
3. **טקסטים:** כל מחרוזת עברית בממשק עוברת ל־`t('key')`. כל סשן כותב למילון **משלו** (קובץ נפרד לכל אזור, ראו סשן 0) – כך סשנים יכולים לרוץ במקביל בלי להתנגש.
4. **כיוון:** `ml-/mr-` → `ms-/me-`, `left-/right-` → `start-/end-`, `text-right` → `text-start`. אייקוני חץ "אחורה" מתהפכים לפי `dir`.
5. **בדיקה בסוף כל סשן:** כל מסך שנגעו בו נפתח בדפדפן ב־4 צירופים – עברית/כהה, עברית/בהיר, אנגלית/כהה, אנגלית/בהיר – עם צילום מסך. וגם `npm run build` ו־`npm run check:i18n-theme` (ראו סשן 0) עוברים בלי שגיאות על הקבצים של הסשן.

---

## מדריך עבודה לכל סשן (נבנה בסשן 0)

**צבעים – טוקנים** (מוגדרים ב־`src/index.css`, מחוברים ב־`tailwind.config.js`):

| במקום | להשתמש ב־ |
|---|---|
| `bg-gray-50 dark:bg-emt-dark` (רקע מסך) | `bg-page` |
| `bg-white dark:bg-emt-gray` (כרטיס) | `bg-surface` |
| `bg-gray-100 dark:bg-zinc-900` (שדה, צ'יפ, פאנל פנימי) | `bg-surface-2` |
| `bg-gray-200 dark:bg-zinc-800` (נלחץ / נבחר) | `bg-surface-3` |
| `text-gray-900 dark:text-emt-light`, `text-white` (טקסט ראשי) | `text-fg` |
| `text-gray-500 dark:text-emt-muted` (טקסט משני) | `text-fg-muted` |
| `text-gray-400` (אייקון, placeholder) | `text-fg-subtle` |
| `border-gray-200 dark:border-emt-border` | `border-line` / `divide-line` |
| `text-white/70`, `bg-white/10`, `border-white/10` (שקיפות על כהה) | `text-fg/70`, `bg-fg/10`, `border-fg/10` |
| `style={{ color: 'rgba(255,255,255,0.35)' }}` | `style={{ color: 'rgb(var(--fg) / 0.35)' }}` |

טקסט לבן על כפתור צבעוני (`bg-emt-red text-white`) – נשאר כמו שהוא. מסך שחייב להישאר כהה תמיד (למשל מצלמה) – מסמנים `// theme-ok: <סיבה>`.

**תרגום:**
- `import { useTranslation } from '<...>/i18n'` ואז `const t = useTranslation();` → `t('key')`, ועם משתנים: `t('appVersion', { version: '2.1' })` כשבמילון כתוב `'גרסה {version}'`.
- מחוץ לקומפוננטה (store, alert, TTS): `translate('key')`.
- כשצריך להחליט לפי שפה (למשל לבחור קובץ תוכן): `const { isEn, dir } = useLanguage();`.
- כל סשן כותב רק לקובץ המילון שלו ב־`src/i18n/` (בראש כל קובץ כתוב איזה סשן הוא שלו). `common.ts` – לקריאה בלבד; יש בו כבר מילים כלליות (אישור, חיפוש, טוען, שגיאה, ימים, ק"ג וכו').
- מפתחות שטוחים וייחודיים בכל הקבצים. אם מפתח קיים כבר בקובץ אחר – לתת שם עם קידומת של האזור (`cprStart` ולא `start`).
- מפתח שחסר באנגלית = שגיאת TypeScript, אז `npm run build` לא יעבור.
- שם של שפה (עברית / English) וטקסט שמיועד למטופל בשפה זרה – לא מתרגמים; מסמנים `// i18n-ok: <סיבה>`.

**בדיקה:**
- `npm run check:i18n-theme` – טבלה לכל `src`.
- `npm run check:i18n-theme -- --strict <קבצים או תיקיות של הסשן>` – כל ממצא עם מספר שורה; צריך להגיע ל־0 לפני שמסיימים.
- נקודת התחלה (אחרי סשן 0): 76 קבצים, 1,946 מחרוזות עבריות, 941 צבעים קבועים, 188 צבעים בתוך style.

**הפעלה מקומית:** בתיקיית worktree חדשה צריך להעתיק את `.env.local` מהתיקייה הראשית (הוא לא ב־git), אחרת האפליקציה נתקעת על מסך הטעינה.

---

## הסשנים

### סשן 0 – תשתית ✅ בוצע
מה נעשה: טוקני צבע; רקע העמוד וצבע שורת הסטטוס עוקבים אחרי המצב (גם לפני שהאפליקציה נטענת); שפה וכיוון נקבעים כבר בטעינה הראשונה; המילון פוצל ל־`src/i18n/` (10 קבצים) עם בדיקת התאמה עברית/אנגלית; נוסף `npm run check:i18n-theme`; מסך ההגדרות תורגם ועבר לטוקנים ונבדק בדפדפן ב־4 הצירופים.

התוכנית המקורית לסשן הזה:
- טוקני צבע: משתני CSS ב־`src/index.css` תחת `:root` ו־`.dark`, וחיבור שלהם ב־`tailwind.config.js` (`surface`, `surface-2`, `surface-3`, `fg`, `fg-muted`, `fg-subtle`, `line`, `overlay`).
- פיצול המילון: `src/i18n/` עם קובץ לכל אזור (`common`, `home`, `cpr`, `hub`, `settings`, `calculators`, `references`, `learning`, `special`, `onboarding`), כל אחד עם `he` ו־`en`. `useTranslation` מאחד אותם; המפתחות הקיימים עוברים ל־`common`/`home` בלי לשבור שימושים קיימים. בטיפוסים: מפתח שחסר ב־`en` = שגיאת TypeScript.
- סקריפט בדיקה `npm run check:i18n-theme` שמדפיס לכל קובץ: מחרוזות עבריות בתוך JSX שלא עוברות דרך `t()`, ומחלקות/סגנונות צבע קבועים (`text-white`, `bg-black`, `rgba(255,255,255`) שאינם טוקנים. אפשר להריץ אותו על תיקייה אחת.
- `SettingsModal.tsx` – המסך שממנו מחליפים מצב ושפה – מתורגם ומתוקן כאן, כדי שאפשר יהיה לבדוק כל השאר.
- תיעוד הכללים בקצרה ב־README או בראש הקובץ הזה.

**אחרי סשן 0 אפשר להריץ את סשנים 1–8 במקביל** (כל אחד נוגע בקבצים אחרים ובקובץ מילון משלו).

### סשן 1 – מסך הבית
`App.tsx`, `BottomNav`, `VitalsFeature` וכל `features/vitals/components/*` (`VitalsCard`, `AddVitalsModal`, `EditVitalsModal`, `VitalsHistoryModal`, `NumericKeypad`, `ResultPopup`, `AlertOverlay`, `CalculatorModal`), `MetronomeCard`, `QuickToolsCard`, `quicktools/MedicationsModal`, `OxygenCalculatorModal`, `NotesModal`, `camera/CameraCapture`, `camera/GalleryModal`.
רובם כבר חלקית מתורגמים – להשלים את מה שחסר ולעבור לטוקנים.

### סשן 2 – החייאה
`CPRTimerOverlay` (86 צבעים ב־style), `cprProtocol.ts` (הנחיות הקואוץ' – טקסט ממשק, לתרגם), `metronomeStore`, `ShockCalculator`, `AfterCallModal`, `debriefStore`, `utils/tts.ts` (קול באנגלית כשהשפה אנגלית).

### סשן 3 – מסך הכלים (Hub) והגדרות
`HubModal.tsx` (1,297 שורות – רשימת כל הכלים, הכותרות והקטגוריות), `AccessibilityModal`, `CalculatorsModal`, `NavChoiceModal`.

### סשן 4 – מחשבונים
`AdultDosageCalculatorModal`, `PediatricDosageCalculatorModal`, `ApgarCalculatorModal`, `BurnsCalculatorModal`, `GlasgowCalculatorModal`, `QSofaCalculatorModal`, `TubeSizingCalculatorModal`, `BarPsiConverterModal`, `VitalsReferenceModal`, `BodySilhouette`, `AdultBodyDiagram`, `ChildBodyDiagram`.
(שמות שדות, יחידות, פירוש תוצאה – כן. טבלאות מינון – לפי ההחלטה למעלה.)

### סשן 5 – מידע ומאגרים
`HospitalsModal`, `HospitalAccordionItem`, `HospitalLoadModal`, `PoisonCentersModal`, `HazmatLookup`, `CommonMedsModal`, `BagStandardsModal` (1,204 שורות), `AmbulanceChecklistModal`, `MedicalAbbreviationsModal`.

### סשן 6 – אתגר יומי
`DailyChallengeModal.tsx` לבד – 3,501 שורות, 144 שורות עברית, אפס `dark:`. כולל לוח מובילים, פודיום, מסכי תוצאה. ייתכן שיתפצל לשני סשנים (משחק / לוח מובילים). שאלות שמגיעות מהשרת – לפי ההחלטה למעלה.

### סשן 7 – למידה
`DailyPushModal`, `ConceptsModal`, `AbbreviationFlashcards`, `FlashcardTrainer`, `abbreviationSrsStore`, `utils/flashcardStats.ts`.

### סשן 8 – מסכים מיוחדים ומתורגמנים
`ContractionTimerModal` (89 צבעים ב־style), `ChildCalmScreen`, `BreathingSynchronizer`, `BigTextScreen`, `SoulDepartureModal`, `MedicalHistoryModal`, `MedicationScannerModal` (+ לבדוק ש־`api/_medScanPrompt.ts` מחזיר תשובה בשפת המשתמש), `MedicalTranslatorModal`, `translators/LanguageBridgeModal` (2,230 שורות – אולי סשן משלו).
שימו לב: במתורגמנים יש טקסט שמיועד למטופל בשפה זרה – הוא לא משתנה לפי שפת הממשק. רק הממשק של החובש מתורגם.

### סשן 9 – חלונות קופצים, כניסה ודפים כלליים
`WelcomeModal`, `LegalDisclaimerModal`, `UpdateModal`, `UpdateAnnouncementModal`, `components/WhatsNewModal`, `hub/components/WhatsNewModal`, `MigrationBanner`, `FeedbackModal`, `SupportModal`, `pages/SupportPage`, `auth/AuthFeature`, `auth/components/AuthCard`, `pwa/FullInstallModal`, `legal/LegalDocsModal` (המסגרת; התוכן – לפי ההחלטה). (`App.tsx` כולו שייך לסשן 1.)

### סשן 10 (אופציונלי, אחרי החלטה) – תוכן רפואי ומשפטי באנגלית
קבצי `src/features/hub/data/*`, `legalContent.ts`, והנחיה ל־`api/_dailyPrompts.ts` / פונקציית `generate-daily-questions` לייצר גם אנגלית. דורש בדיקה רפואית לפני עלייה לאוויר.

### סשן 11 – מעבר סופי (אחרון)
- `npm run check:i18n-theme` על כל `src` – אפס ממצאים (או רשימת חריגים מוצדקת).
- מעבר בדפדפן על **כל** מסך ברשימה למעלה ב־4 הצירופים, בגודל טלפון, עם צילומים לדוח.
- בדיקת החלפה חיה: לשנות מצב/שפה בהגדרות כשמסך פתוח ולוודא שהכל מתעדכן בלי רענון.
- בדיקה שההעדפה נשמרת אחרי רענון ובהפעלה מחדש של ה־PWA.

---

## סדר מומלץ
סשן 0 → סשנים 1–9 במקביל (עד 3–4 בו זמנית כדי שיהיה קל לבדוק) → סשן 11. סשן 10 רק אם הוחלט.
