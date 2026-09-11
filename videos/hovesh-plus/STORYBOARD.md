---
format: 1080x1920
duration: 40s
message: "עזרה ראשונה בכל מצב חירום"
arc: PAS — hook → pain → product intro → feature showcase → benefit → CTA
audience: "אנשי רפואה, מתנדבי חירום ואנשים שרוצים להיות מוכנים למצב חירום"
mode: collaborative
music: none
---

## Video direction

- **palette system** (from `frame.md`, by role — never raw hex): dark register = ground `ink-black` / text `cream` / accent `fire-orange` (the app's medical red-accent maps here) throughout; Frame 6 briefly flips to the orange register (ground `fire-orange`, text `ink-black`) for the offline-trust beat, then Frame 7 returns to dark for the CTA lockup.
- **motion grammar + reveal model**: long-tail `power3` eases everywhere (no bounce). No spoken audio drives this cut — each frame's on-screen Hebrew text (the storyboard `voiceover` line) is itself the animation subject; treat each phrase segment (split at the existing punctuation/dashes) as one reveal cue, timed evenly across the frame's duration, never all at once. Nothing appears before its cue. During a hold, at most a subtle jitter — no lazy breathing, no forced drift.
- **rhythm / held-frame allocation**: Frames 1–2 move fast (staccato word drops, ~1 cue/second) to build urgency. Frame 3 (product reveal) and Frame 6 (offline trust) are the video's **held/breather beats** — content resolves early in the window and then reads still. Frames 4–5 are busy card-assembly beats. Frame 7 ends on a fully held final lockup.
- **negative list**: no stock photography, no generic "AI" gradient blobs, no browser chrome/cursors, no nav bars, no scrollbars. Never front-load-then-freeze (dumping the whole frame at t=0.0 and going static) and never screensaver-drift (independent floating elements with no hierarchy). Nothing graphic/alarming — no blood, no injury imagery; urgency comes from typography and pace, not shock visuals.

## Frame 1 — הוק: כל שנייה קובעת

- scene: כותרת ענקית פועמת על רקע כהה, טיפוגרפיה בלבד
- voiceover: "מצב חירום. כל שנייה — קובעת."
- duration: 4s
- transition_in: cut
- status: outline
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Pain validation
- beat: urgency
- blueprint: kinetic-type-beats (Reproduce)
- sfx: impact-soft

Reproduce: two escalating word-drops resolving on the beat word "קובעת" — the kinetic-type-beats signature.
Scene 1 (0.0–2.0s): "מצב חירום." slams in dead-center, oversized `h1` role on dark register, hard cut in on a heavy `power3` ease — Centered template, ~55% of frame.
Scene 2 (2.0–4.0s): "מצב חירום." holds small upper-third as "כל שנייה — קובעת." drops in beneath it, "קובעת" isolated on its own beat in `fire-orange` accent and slightly larger weight than the rest of the line — Centered, stacked, ~65% of frame. Holds still on landing (no drift).

narrativeRole: פותח בדחיפות הרגשית של מצב חירום, בלי להציג עדיין את המוצר.
keyMessage: כל שנייה חשובה כשמשהו קורה.

## Frame 2 — הכאב: לחץ ובלבול

- scene: מילות מפתח קצרות נופלות אחת אחרי השנייה — לחץ, בלבול, אין זמן
- voiceover: "לחץ. בלבול. אין זמן לחפש פרוטוקול."
- duration: 4s
- transition_in: crossfade
- status: outline
- src: compositions/frames/02-pain.html
- type: pain_point
- persuasion: Pain agitation
- beat: anxiety + overwhelm
- blueprint: kinetic-type-beats (Reproduce)
- sfx: whoosh-short

Reproduce: 3 short pain statements landing solo, one at a time, before the next clears — the bank's PROBLEM/kinetic-type-beats pattern.
Scene 1 (0.0–1.3s): "לחץ." lands solo, centered, dark register, `h1` weight — Centered, ~40% of frame — then clears (fades/slides out).
Scene 2 (1.3–2.6s): "בלבול." replaces it in the same spot, same weight — Centered, ~40% of frame — then clears.
Scene 3 (2.6–4.0s): "אין זמן לחפש פרוטוקול." lands and holds to the end, slightly smaller `lead` weight so the fuller sentence still fits — Centered, ~50% of frame. Held read, no drift.

narrativeRole: ממחיש את הבעיה הממשית של מי שנמצא/ת בשטח בזמן אמת.
keyMessage: בזמן חירום אין זמן לחפש מידע.

## Frame 3 — היכרות עם חובש+

- scene: מסך האפליקציה החי (חובש+, מצב אופליין, PWA) מתגלה במרכז הפריים
- voiceover: "חובש פלוס. כל כלי העזרה הראשונה שלך — במקום אחד."
- duration: 5s
- transition_in: zoom-through
- status: outline
- src: compositions/frames/03-product-intro.html
- type: product_intro
- persuasion: Friction reduction
- beat: relief + control
- blueprint: device-surface-showcase (Adapt)
- asset_candidates: assets/full-page.png — צילום מסך אמיתי של מסך הפתיחה של חובש+ (כהה, לוגו, הודעת עבודה אופליין)
- focal: assets/full-page.png
- roles: full-page.png = cutout (phone-framed device surface, centered)
- sfx: riser

Adapt: keep the "introduced by its real interface" signature, but this is a static captured screen (no live cursor interaction) — held reveal instead of a stepped demo loop.
Scene 1 (0.0–1.5s): dark backdrop; the word "חובש" slams in upper-third, bold `h1`, dark register — Centered, ~35% of frame.
Scene 2 (1.5–3.2s): "פלוס" lands beside it in `fire-orange` accent completing the wordmark; simultaneously the real captured app screen (assets/full-page.png) rises up from below, framed in a simple phone-shaped mask, and settles centered beneath the wordmark — Centered, asymmetric 70/30 (wordmark top / device below), 3 depth layers (backdrop, device, wordmark).
Scene 3 (3.2–5.0s): "כל כלי העזרה הראשונה שלך — במקום אחד." types on in the caption-band-safe zone above the device; frame holds still, device and wordmark steady — Centered, ~60% of frame. Held read.

narrativeRole: מציג את המוצר בפעם הראשונה כתשובה לכאב שתואר.
keyMessage: חובש+ הוא כלי אחד מרוכז לכל מה שצריך בחירום.

## Frame 4 — כלי המפתח: קצב ומדדים

- scene: כרטיסיות קופצות אחת אחרי השנייה — מטרונום החייאה, דופק, נשימות, BPM
- voiceover: "מטרונום החייאה. דופק. נשימות. מד BPM — הקצב הנכון, בלחיצה אחת."
- duration: 5s
- transition_in: push-slide UP
- status: outline
- src: compositions/frames/04-feature-rhythm.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: control + confidence
- blueprint: grid-card-assemble (Reproduce)
- sfx: pop-soft (×4)

Reproduce: a card grid self-assembles one term at a time as the VO-guide names each tool — "look how much it does."
Scene 1 (0.0–1.2s): "מטרונום החייאה" pops into a pill card, upper-left of a 2×2 grid — asymmetric grid, ~30% of frame.
Scene 2 (1.2–2.4s): "דופק" pops into the next card, upper-right — grid now 50% filled.
Scene 3 (2.4–3.6s): "נשימות" pops in lower-left; "מד BPM" pops in lower-right almost simultaneously, completing the 2×2 grid — grid ~70% of frame, all 4 cards lit in `fire-orange` accent borders.
Scene 4 (3.6–5.0s): "הקצב הנכון, בלחיצה אחת." lands as a closing line beneath the completed grid; grid holds still, no further motion — Centered caption under grid. Held read.

narrativeRole: מדגים את הכלי המרכזי והייחודי ביותר — שמירת קצב בהחייאה.
keyMessage: הקצב הנכון תמיד זמין, בלי לחשוב פעמיים.

## Frame 5 — עוד כלים בהישג יד

- scene: רשימה מצטברת — מחשבונים רפואיים, היסטוריית מדדים, סיוע בתרגום, אתגר יומי
- voiceover: "מחשבונים רפואיים. היסטוריית מדדים. סיוע בתרגום. הכל, תוך שניות."
- duration: 5s
- transition_in: push-slide UP
- status: outline
- src: compositions/frames/05-feature-tools.html
- type: feature_showcase
- persuasion: Value stacking
- beat: confidence
- blueprint: grid-card-assemble (Reproduce)
- sfx: pop-soft (×3)

Reproduce: a vertical value list accumulates ~1/sec, co-resident, each popping into its slot — the BENEFITS bank pattern.
Scene 1 (0.0–1.5s): "מחשבונים רפואיים" pops into slot 1 of a vertical list, top of frame — asymmetric 60/40, list left-aligned.
Scene 2 (1.5–3.0s): "היסטוריית מדדים" pops into slot 2 beneath it; list now 2 items tall.
Scene 3 (3.0–4.3s): "סיוע בתרגום" pops into slot 3, completing the list.
Scene 4 (4.3–5.0s): "הכל, תוך שניות." lands as a closing line below the completed list; everything holds still. Held read.

narrativeRole: מרחיב את התמונה — לא רק כלי אחד, אלא ארגז כלים שלם.
keyMessage: חובש+ מכיל את כל הכלים הנדרשים, לא רק אחד.

## Frame 6 — עובד גם בלי אינטרנט

- scene: כרטיס רגוע אחד במרכז — "עובד גם ללא אינטרנט", אייקון Wi-Fi חצוי
- voiceover: "עובד גם בלי אינטרנט — כי בשטח, אין זמן לחכות לרשת."
- duration: 4s
- transition_in: crossfade
- status: outline
- src: compositions/frames/06-benefit-offline.html
- type: benefit_highlight
- persuasion: Risk reversal
- beat: trust + control
- blueprint: titlecard-reveal (Reproduce)
- sfx: soft-chime

Reproduce: one clean two-line value title, one slide-up crossfade, then held still — low motion is the point; the register flips to orange for visual contrast at this pivotal reassurance beat.
Scene 1 (0.0–1.5s): frame flips to the orange register (ground `fire-orange`, text `ink-black`); a Wi-Fi icon with a strike-through slides up and fades in, centered — Centered, ~30% of frame.
Scene 2 (1.5–4.0s): "עובד גם בלי אינטרנט" slides up beneath the icon and settles; a beat later "כי בשטח, אין זמן לחכות לרשת." fades in as a smaller second line — Centered, stacked, ~55% of frame. Frame holds fully still to the end (the calm is the confidence).

narrativeRole: מסיר את החשש המרכזי מיישומים דיגיטליים בשטח — תלות ברשת.
keyMessage: האפליקציה אמינה גם באזורים ללא כיסוי סלולרי.

## Frame 7 — קריאה לפעולה

- scene: לוגו חובש+ נבנה במרכז, ואז שורת קריאה לפעולה מופיעה מתחתיו
- voiceover: "חובש פלוס. הוסיפו למסך הבית — ותהיו מוכנים לכל מצב."
- duration: 5s
- transition_in: crossfade
- status: outline
- src: compositions/frames/07-cta.html
- type: cta
- persuasion: Scarcity/urgency
- beat: motivation + control
- blueprint: logo-assemble-lockup (Reproduce)
- sfx: impact-soft

Reproduce: the logo builds, then a fast beat resolves on the URL/action — landing on the completed lockup.
Scene 1 (0.0–1.8s): frame returns to the dark register; "חובש" and "פלוס" assemble from opposite sides and lock together dead-center as the wordmark, `fire-orange` accent on "פלוס" — Centered, ~40% of frame.
Scene 2 (1.8–3.5s): "הוסיפו למסך הבית" types on beneath the completed wordmark — Centered, stacked, ~55% of frame.
Scene 3 (3.5–5.0s): "ותהיו מוכנים לכל מצב." lands as the final line beneath it; everything holds fully still on the completed lockup to the end. Held read.

narrativeRole: סוגר את הסרטון בקריאה ברורה לפעולה מיידית.
keyMessage: התקינו עכשיו — היו מוכנים לפני שיקרה משהו.
