# Phase 4 — UI/UX Overhaul: Execution Plan

## Current State Analysis

| File | Current Role | Problem |
|---|---|---|
| `DashboardPage.tsx` | Thin wrapper for `VitalsFeature` | Fine as-is, no change needed |
| `VitalsFeature.tsx` | 2-card column layout | Missing grid, nav bar, Metronome, Quick Tools; "האם סדיר ונימוש?" always visible |
| `VitalsCard.tsx` | 3-state card (idle/running/finished) | No Stop button; inline keypad (must become modal); alert text always shown |
| `NumericKeypad.tsx` | Inline keypad inside card | Wrong digit order (calculator layout); must be extracted into modal |
| `useVitalsTimer.ts` | idle/running/finished logic | No `stop()` / cancel action |

---

## Target File Tree

```
src/
├── pages/
│   └── DashboardPage.tsx          [NO CHANGE]
│
├── features/
│   ├── vitals/
│   │   ├── VitalsFeature.tsx      [REWRITE] — 4-grid layout shell + bottom nav
│   │   ├── components/
│   │   │   ├── VitalsCard.tsx     [UPDATE] — stop button, alert overlay, opens modal
│   │   │   ├── NumericKeypad.tsx  [UPDATE] — LTR digit order (1-2-3), dir="ltr"
│   │   │   ├── CalculatorModal.tsx [CREATE] — full-screen modal container
│   │   │   ├── ResultPopup.tsx    [CREATE] — massive result overlay, tap-to-close
│   │   │   └── AlertOverlay.tsx   [CREATE] — 7-second "האם סדיר ונימוש?" red overlay
│   │   └── hooks/
│   │       └── useVitalsTimer.ts  [UPDATE] — add stop() function
│   │
│   ├── metronome/
│   │   ├── MetronomeCard.tsx      [CREATE] — BPM display, slider, play/stop
│   │   └── hooks/
│   │       └── useMetronome.ts    [CREATE] — tick logic, AudioContext beep
│   │
│   └── quicktools/
│       └── QuickToolsCard.tsx     [CREATE] — flashlight toggle + camera placeholder
│
├── components/
│   └── BottomNav.tsx              [CREATE] — fixed bottom bar: Notes + Saved Files
│
└── store/
    └── metronomeStore.ts          [CREATE] — Zustand: bpm, isPlaying, setBpm, toggle
```

---

## Step-by-Step Execution Order

### Step 1 — `useVitalsTimer.ts` (UPDATE)
**Change:** Add a `stop()` function (identical to `reset()` in effect — returns timer to `idle`,
clears interval, resets `timeLeft`). This cleanly separates "user cancelled" from "timer finished".

```
Export: { state, timeLeft, start, stop, reset }
```

---

### Step 2 — `AlertOverlay.tsx` (CREATE)
**Purpose:** "האם סדיר ונימוש?" 7-second timed overlay.

**Props:** `visible: boolean`

**Behavior:**
- `position: fixed` (covers full screen), `z-index: 40` (below modals at z-50)
- Centers text vertically and horizontally
- Text: bold, `text-emt-red`, very large (`text-4xl` or `text-5xl`)
- Fades in/out with a CSS transition or `animate-pulse` for urgency
- Parent controls `visible`; parent uses a `useEffect` with `setTimeout(7000)` to set it back to false

**Note:** This component is purely presentational — it does NOT manage its own timer.

---

### Step 3 — `VitalsCard.tsx` (UPDATE)
**Changes:**

1. **Accept `isHeartRate?: boolean` prop.**
2. **Running state:** Add a Stop/Cancel button (calls `stop()`). Style: small, secondary, below the countdown.
3. **Finished state:** Instead of rendering `NumericKeypad` inline, call `onOpenModal()` callback (prop) to signal the parent to open the full-screen `CalculatorModal`. The card itself returns to a compact "ready" appearance.
4. **Alert overlay logic (only when `isHeartRate === true`):**
   - Track `alertVisible` in local state
   - On `start()`, also set `alertVisible = true`
   - `useEffect` watching `alertVisible`: when true, set a 7-second timeout → set `alertVisible = false`
   - Render `<AlertOverlay visible={alertVisible} />`

**Props interface:**
```ts
interface Props {
  label: string;
  duration: number;
  multiplier: number;
  unit: string;           // e.g. "BPM" or "נשימות/דקה"
  isHeartRate?: boolean;
  onOpenModal: (multiplier: number, unit: string) => void;
}
```

---

### Step 4 — `NumericKeypad.tsx` (UPDATE)
**Change 1 — Digit order:** Replace `['7','8','9','4','5','6','1','2','3']` with `['1','2','3','4','5','6','7','8','9']` (standard phone layout, left-to-right).

**Change 2 — Direction:** Wrap the grid in `<div dir="ltr">` to enforce LTR rendering regardless of the page's RTL context.

**Change 3 — Remove reset button:** The "אפס" button is removed. Reset will be handled by the modal's X button.

**Change 4 — Callback on calculate:** Instead of calling `onCalculate()` and letting the parent decide what to do, the keypad calls `onResult(value: number)` with the computed result. The modal parent triggers the ResultPopup.

---

### Step 5 — `ResultPopup.tsx` (CREATE)
**Purpose:** Full-screen tap-to-close popup showing the calculated result.

**Props:** `result: number | null`, `unit: string`, `onClose: () => void`

**Appearance:**
- `fixed inset-0 z-50` dark semi-transparent backdrop
- Centered card: `rounded-3xl`, glassmorphism (`bg-white/10 backdrop-blur-xl border border-white/20`)
- Result value: enormous (`text-8xl font-black text-white`)
- Unit label below (e.g., "BPM"): `text-2xl text-emt-light/70`
- Entire screen is a click target → calls `onClose()`

---

### Step 6 — `CalculatorModal.tsx` (CREATE)
**Purpose:** Full-screen modal container for the numeric keypad.

**Props:**
```ts
interface Props {
  isOpen: boolean;
  multiplier: number;
  unit: string;
  onClose: () => void;
  onResult: (value: number) => void;
}
```

**Layout:**
- `fixed inset-0 z-50`
- Dark blurred backdrop (`bg-black/70 backdrop-blur-sm`)
- Centered inner panel: `rounded-3xl bg-emt-gray border border-emt-border p-6 max-w-sm w-full mx-4`
- Top row: title ("הכנס מספר") on the right, X close button on the left (RTL aware)
- Below: `<NumericKeypad>` with the updated LTR layout
- Clicking the backdrop (outside the panel) calls `onClose()`
- X button calls `onClose()`
- When `NumericKeypad` fires `onResult(value)`: close modal → parent opens `ResultPopup`

---

### Step 7 — `metronomeStore.ts` (CREATE)
**Zustand slice** (no `persist` middleware — not patient data):

```ts
interface MetronomeStore {
  bpm: number;          // default: 100
  isPlaying: boolean;
  setBpm: (bpm: number) => void;
  toggle: () => void;
}
```

---

### Step 8 — `useMetronome.ts` (CREATE)
**Purpose:** Drives the audio tick using `AudioContext`.

**Logic:**
- Reads `bpm` and `isPlaying` from `metronomeStore`
- When `isPlaying`, schedules recurring beeps via `AudioContext.createOscillator()` at interval = `60000 / bpm` ms
- Cleans up on stop or unmount
- Falls back to a silent interval if `AudioContext` is unavailable

---

### Step 9 — `MetronomeCard.tsx` (CREATE)
**Purpose:** Bottom-right grid cell.

**Layout (top to bottom):**
- Label: "מטרונום"
- BPM display: large number (`text-5xl font-mono text-emt-yellow`)
- Range slider: `min=40 max=200 step=1`, styled with Tailwind (accent color yellow)
- Play/Stop button: large, rounded, red when playing / green when stopped

**Calls `useMetronome()` hook; reads/writes via `metronomeStore`.**

---

### Step 10 — `QuickToolsCard.tsx` (CREATE)
**Purpose:** Bottom-left grid cell.

**Layout:**
- Label: "כלי עזר"
- Flashlight toggle button: calls `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }})` then sets torch constraint via `MediaStreamTrack.applyConstraints({ advanced: [{ torch: true/false }] })`
- Camera placeholder button: styled button with camera icon, shows a "בקרוב" badge for now

**Local state only** (no store needed for this card).

---

### Step 11 — `BottomNav.tsx` (CREATE)
**Purpose:** Fixed navigation bar at the bottom of the screen.

**Layout:**
- `fixed bottom-0 left-0 right-0 z-30`
- `h-16`, `bg-emt-gray/90 backdrop-blur border-t border-emt-border`
- Two equal-width buttons side by side:
  - **Notes** (right, RTL-first): `FileText` icon + "פתקים"
  - **Saved Files** (left): `FolderOpen` icon + "קבצים שמורים"
- Buttons are placeholders for now (no navigation yet, just `onClick={() => {}}`)

---

### Step 12 — `VitalsFeature.tsx` (REWRITE)
**Purpose:** Root layout orchestrator. Owns the modal/popup state.

**State managed here:**
```ts
const [modalOpen, setModalOpen] = useState(false);
const [activeMultiplier, setActiveMultiplier] = useState(4);
const [activeUnit, setActiveUnit] = useState('BPM');
const [result, setResult] = useState<number | null>(null);
```

**Layout structure:**
```
<div class="h-screen overflow-hidden flex flex-col bg-emt-dark">

  {/* 2×2 Grid — grows to fill space above bottom nav */}
  <main class="flex-1 grid grid-cols-2 gap-2 p-2 pb-0 overflow-hidden">
    {/* RTL: col 1 = visual RIGHT, col 2 = visual LEFT */}

    {/* Row 1, visual Right → Heart Rate */}
    <VitalsCard label="דופק" duration={15} multiplier={4} unit="BPM"
      isHeartRate onOpenModal={openModal} />

    {/* Row 1, visual Left → Breathing */}
    <VitalsCard label="נשימות" duration={30} multiplier={2} unit="נשימות/דקה"
      onOpenModal={openModal} />

    {/* Row 2, visual Right → Metronome */}
    <MetronomeCard />

    {/* Row 2, visual Left → Quick Tools */}
    <QuickToolsCard />
  </main>

  {/* Fixed Bottom Nav */}
  <BottomNav />

  {/* Full-screen Calculator Modal */}
  <CalculatorModal isOpen={modalOpen} multiplier={activeMultiplier}
    unit={activeUnit} onClose={closeModal} onResult={handleResult} />

  {/* Result Popup */}
  <ResultPopup result={result} unit={activeUnit}
    onClose={() => setResult(null)} />

</div>
```

---

## Design Tokens (no tailwind.config.js changes needed)

All required tokens already exist:
- `emt-dark` (#0D0D0D) — page background
- `emt-gray` (#1E1E1E) — card/modal surfaces
- `emt-border` (#2C2C2C) — borders
- `emt-red` (#E53935) — alert text, stop button, heart rate accent
- `emt-green` (#43A047) — start/play button
- `emt-yellow` (#FDD835) — metronome accent
- `emt-light` (#F5F5F5) — primary text

Glassmorphism recipe (used in modals/popups):
```
bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl
```

---

## Key Constraints & Rules (from MEMORY.md architecture)

| Rule | How Phase 4 Respects It |
|---|---|
| Max 150 lines/component | Each new component has a single focused responsibility |
| Three-layer split: Feature / components/ / hooks/ | Metronome follows `MetronomeCard` + `useMetronome` + `metronomeStore` |
| One Zustand slice per domain | `metronomeStore` for metronome only; vitals card state stays local |
| `persist` only on `patientStore` | `metronomeStore` has NO persist middleware |
| All backend calls via `src/lib/` only | No backend calls in Phase 4 |
| Local-first | All Phase 4 state is local; no Supabase calls |

---

## Implementation Order (safe dependency sequence)

```
1. useVitalsTimer.ts        — adds stop(), no deps
2. AlertOverlay.tsx         — pure presentational, no deps
3. NumericKeypad.tsx        — update digit order, simpler interface
4. ResultPopup.tsx          — pure presentational, no deps
5. CalculatorModal.tsx      — depends on NumericKeypad
6. VitalsCard.tsx           — depends on AlertOverlay, useVitalsTimer
7. metronomeStore.ts        — Zustand slice, no deps
8. useMetronome.ts          — depends on metronomeStore
9. MetronomeCard.tsx        — depends on useMetronome, metronomeStore
10. QuickToolsCard.tsx      — standalone, no deps
11. BottomNav.tsx           — standalone, no deps
12. VitalsFeature.tsx       — depends on all cards + CalculatorModal + ResultPopup + BottomNav
```

---

## Out of Scope for Phase 4

- Notes page implementation (button is placeholder only)
- Saved Files page implementation (button is placeholder only)
- Supabase sync for any Phase 4 data
- Patient data encryption
- Authentication guard changes
