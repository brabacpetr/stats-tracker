# Floorball Match Stats Tracker — Development Plan v2

## Project Overview

A mobile-first, touch-optimized Progressive Web App for live floorball match stat tracking. Built with **Vite + TypeScript + Svelte**, deployed as static files to **Cloudflare Pages**. Replaces pen-and-paper workflow with one-tap shot logging and direct save to a **predefined Google Sheet**.

---

## Tech Stack Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Language** | TypeScript (strict mode) | Type safety, IDE support, catches bugs at build time |
| **Framework** | Svelte 5 (runes) | Compiles to vanilla JS (tiny bundle), reactive by default, no virtual DOM overhead, `.svelte` files are intuitive for component-based UI. Much lighter than React, great DX. |
| **Build tool** | Vite 6 | Fast HMR in dev, optimized production builds, first-class Svelte/TS support via `@sveltejs/vite-plugin-svelte` |
| **Styling** | Scoped Svelte `<style>` + CSS custom properties | No extra CSS framework needed; Svelte scopes styles per component; design tokens via CSS variables in `:root` |
| **Google Sheets** | Google Identity Services (GIS) + Sheets API v4 (browser client) | OAuth2 implicit/PKCE flow in-browser, no backend needed. User signs in once, app appends rows to a predefined sheet. |
| **Hosting** | Cloudflare Pages | Free tier, Git-deploy from repo, serves `dist/` as static site |
| **Offline** | Service Worker (Vite PWA plugin) | `vite-plugin-pwa` generates SW + manifest, precaches app shell |

### Why Svelte over alternatives

- **Svelte compiles away** — no framework runtime shipped to the client, so the bundle is ~15-25KB total for an app this size. Important for arena/gym environments with poor connectivity.
- **Svelte 5 runes** (`$state`, `$derived`, `$effect`) — explicit reactivity that reads like plain TS, no magic stores or signals imports from external packages.
- **Built-in transitions/animations** — `transition:slide`, `animate:flip` etc. are first-class, perfect for the counter animations and screen transitions.
- **Scoped CSS** — styles live in the component file, no CSS-in-JS overhead, no class name collisions.
- You're already working with Vue 3 Composition API at LECTURA, so Svelte's single-file-component model will feel familiar but simpler.

---

## Google Sheets Integration Architecture

### Authentication Approach: OAuth2 via Google Identity Services (GIS)

A service account is **not viable** for a pure client-side app — the private key would be exposed in the browser. Instead, we use Google's recommended browser OAuth2 flow:

1. **Google Cloud Console setup** (one-time):
   - Create a GCP project (or reuse existing)
   - Enable **Google Sheets API**
   - Create **OAuth 2.0 Client ID** (Web application type)
   - Add authorized JavaScript origins: your Cloudflare Pages domain + `localhost` for dev
   - Create an **API Key** (restricted to Sheets API + your domain)

2. **Runtime flow in the app:**
   - Load `https://accounts.google.com/gsi/client` (Google Identity Services library)
   - Load `https://apis.google.com/js/api.js` (Google API client)
   - On "Save" → check if user has a valid token → if not, trigger Google sign-in popup
   - Once authorized, call `gapi.client.sheets.spreadsheets.values.append()` to write data
   - Token is cached in memory for the session; re-prompts on expiry

3. **What gets written:**
   - Appends rows to a **predefined spreadsheet** (ID stored in app config)
   - Each save appends one block of rows: match metadata + per-player stats
   - The spreadsheet structure is fixed — app writes into known columns

### Predefined Spreadsheet Structure

The target Google Sheet should have this structure (created once manually):

**Sheet: "Matches"** (append-only log of all matches, one row per match)

| Column | Content | Example |
|--------|---------|---------|
| A | Date | 2026-03-15 |
| B | Home Team | FbC Pohořelice |
| C | Away Team | SK Brno |
| D | Home Total Shots | 20 |
| E | Away Total Shots | 8 |
| F | Home On Goal | 12 |
| G | Home Blocked | 5 |
| H | Home Missed | 3 |
| I | Away On Goal | 5 |
| J | Away Blocked | 2 |
| K | Away Missed | 1 |

**Sheet: "Player Stats"** (one row per home player per match — away team is not tracked individually)

| Column | Content | Example |
|--------|---------|---------|
| A | Date | 2026-03-15 |
| B | Match (vs) | SK Brno |
| C | # | 7 |
| D | Player | Novák |
| E | On Goal | 3 |
| F | Blocked | 2 |
| G | Missed | 1 |
| H | Total | 6 |
| I | On Goal P1 | 1 |
| J | On Goal P2 | 1 |
| K | On Goal P3 | 1 |
| L | Blocked P1 | 0 |
| M | Blocked P2 | 2 |
| N | Blocked P3 | 0 |
| O | Missed P1 | 0 |
| P | Missed P2 | 0 |
| Q | Missed P3 | 1 |

This gives you a quick match-level overview (including away totals) on the Matches sheet, plus granular per-player, per-period home team data on the Player Stats sheet — all queryable with standard Sheets formulas, pivot tables, or charts.

### Config Management

App config (Sheet ID, Client ID, API Key) is stored in a `.env` file at build time and embedded via `import.meta.env.VITE_*` variables. No secrets are exposed — OAuth Client IDs and API Keys are designed to be public in browser apps (they're restricted by domain in GCP console).

```env
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSy...
VITE_GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

### Fallback: Offline Export

If Google auth fails (no internet, user declines), offer a **JSON download** as fallback. The JSON file can be manually imported later, or a small utility script can batch-upload JSON files to the sheet.

---

## Design System

### Aesthetic Direction: "Dark Arena"

A dark, high-contrast UI inspired by sports broadcast scoreboards. The app should feel like a professional stats console — not a generic form. Think: live sports ticker meets pit-wall telemetry.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0A0E17` | App background, deepest layer |
| `--bg-surface` | `#141A28` | Cards, player rows |
| `--bg-elevated` | `#1C2438` | Active/selected states |
| `--border` | `#2A3350` | Subtle dividers |
| `--text-primary` | `#E8ECF4` | Primary text |
| `--text-secondary` | `#7B8AB0` | Labels, secondary info |
| `--accent-home` | `#22D68A` | Home team accent (green) |
| `--accent-away` | `#F06449` | Away team accent (warm red-orange) |
| `--shot-on-goal` | `#22D68A` | On-goal button (success) |
| `--shot-blocked` | `#F0A030` | Blocked button (amber) |
| `--shot-missed` | `#7B8AB0` | Missed button (muted) |
| `--danger` | `#E84855` | Undo/destructive actions |

### Typography

- **Primary font:** `"JetBrains Mono"` (Google Fonts) — monospaced for stat counters, scoreboard feel
- **Secondary font:** `"DM Sans"` (Google Fonts) — clean geometric sans for labels and body text
- Numbers/counters: JetBrains Mono, large sizes, `font-variant-numeric: tabular-nums`
- Player names: DM Sans semibold, uppercased, letter-spacing `0.05em`

### Spacing & Touch Targets

- Base unit: `4px` grid
- Minimum touch target: `48px × 48px` (Google Material guidelines)
- Shot buttons: `56px` tall, full-width within their column
- Player row height: `~120px` (name + 3 buttons + counter strip)
- Safe area padding: `env(safe-area-inset-*)` for notched phones
- Bottom action bar: `64px` fixed

### Interaction & Motion

- **Tap feedback:** Buttons `scale(0.95)` on `:active`, `50ms` transition
- **Counter pulse:** `scale(1) → scale(1.2) → scale(1)` over `200ms` on increment — use Svelte `animate:` or CSS `@keyframes`
- **Undo toast:** Svelte `transition:fly={{ y: 50 }}`, auto-dismiss `3s`
- **Tab switching:** Svelte `transition:slide` for panel swap, colored underline indicator
- **Save success:** Full-screen overlay with checkmark, Svelte `transition:scale`
- **Haptic:** `navigator.vibrate(30)` on shot tap (Android)

### Layout Architecture

No tab switching needed — home players and the away team totals card all live on the same scrollable surface. The away team card sits at the bottom of the roster, visually distinct with the orange accent.

```
┌──────────────────────────────┐
│  Match Header (sticky)       │  ← Team names, total shots per team
│  [Home: 12]     [Away: 8]   │
├──────────────────────────────┤
│  [⟲ UNDO]    Period [1][2][3]│  ← Always accessible
├──────────────────────────────┤
│  HOME PLAYERS                │  ← Section label
│  ┌─ Player Card ───────────┐ │
│  │ #7  NOVÁK          Σ 6  │ │
│  │ [🥅 On Goal: 3] [🛡 1] [✕ 2] │
│  └─────────────────────────┘ │
│  ┌─ Player Card ───────────┐ │
│  │ #12 DVOŘÁK         Σ 1  │ │
│  │ [🥅 On Goal: 1] [🛡 0] [✕ 0] │
│  └─────────────────────────┘ │
│  ...more home players...     │
│                              │
│  ── divider ──               │
│  AWAY: SK BRNO         Σ 8  │  ← Section label with team name + total
│  ┌─ Away Totals Card ──────┐ │
│  │ [🥅 On Goal: 5] [🛡 2] [✕ 1] │  ← Same 3 buttons, orange accent
│  └─────────────────────────┘ │
│  ...scrollable...            │
│                              │
├──────────────────────────────┤
│  [💾 SAVE TO GOOGLE SHEETS] │  ← Fixed bottom bar
└──────────────────────────────┘
```

**Key layout decisions:**

1. **Sticky header = always-visible scoreboard** — running totals for both teams at a glance.
2. **Undo always one tap away** — pinned sub-header, never scrolls.
3. **Single scrollable surface** — no tabs. Home player cards first, then a visually separated away team totals card at the bottom. Eliminates context-switching. Most taps will be on home players anyway.
4. **Player cards are the primary interaction surface** — large touch targets, color-coded shot buttons with inline count.
5. **Away totals card** — same 3 shot buttons (on goal, blocked, missed) but styled with orange accent and no player name/number — just the team name.
6. **Save is anchored at bottom** — always reachable, protected with confirmation.

### Player Card Detail

```
┌──────────────────────────────────────┐
│  #7  NOVÁK                     Σ 6   │  ← Number, name, total
│  ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ 🥅  3    │ │ 🛡  2    │ │ ✕  1   ││  ← Tap to increment
│  │ On Goal  │ │ Blocked  │ │ Missed ││
│  └──────────┘ └──────────┘ └────────┘│
└──────────────────────────────────────┘
```

- Button colors match shot type tokens
- Count is large (24px mono), centered
- Label is small (11px) below count
- Icons are Unicode — no icon library
- `2px` left border in team accent color

---

## Data Model

```typescript
// types.ts

type ShotType = 'onGoal' | 'blocked' | 'missed';
type TeamSide = 'home' | 'away';
type Period = 1 | 2 | 3;

interface Player {
  id: string;           // nanoid
  number: number | null;
  name: string;
  shots: Record<ShotType, number>;
}

interface LogEntry {
  id: string;           // nanoid — for deduplication
  timestamp: number;
  team: TeamSide;
  playerId: string;     // for home players; 'away' for away team
  type: ShotType;
  period: Period;
}

interface MatchState {
  matchId: string;
  date: string;         // ISO date
  homeTeam: string;
  awayTeam: string;
  currentPeriod: Period;
  players: Player[];    // home team only
  awayShots: Record<ShotType, number>;  // away team aggregate totals
  log: LogEntry[];      // undo stack
}

// Google Sheets config (from env)
interface SheetsConfig {
  clientId: string;
  apiKey: string;
  spreadsheetId: string;
}
```

**Key decisions:**

- **Away team = aggregate only:** `awayShots` is a simple `{ onGoal, blocked, missed }` counter. No player roster, no individual tracking. One card with 3 buttons.
- **Log entries for away:** use `playerId: 'away'` as a sentinel value. Undo knows to decrement `awayShots` instead of looking up a player.
- **Log as undo stack:** Every increment pushes to log. Undo pops last entry and decrements. Log also enables per-period breakdowns in export.
- **localStorage persistence:** Auto-save on every action via `$effect`. Crash recovery built-in.

---

## Screen Flow

```
[1. Setup Screen]
        │
        ▼
[2. Match Tracker]  ←→  [Undo toast]
        │
        ▼
[3. Save Confirmation]  →  Google Sheets append
        │
        ▼
[4. Post-Match Summary]  →  New match / re-save
```

---

## Sprint Plan

### Sprint 0: Project Scaffolding (0.5 day)

| # | Task | Details |
|---|------|---------|
| 0.1 | Init project | `npm create vite@latest floorball-stats -- --template svelte-ts`. Add `.gitignore`, `README.md`. |
| 0.2 | Configure Vite | Install `@sveltejs/vite-plugin-svelte`. Configure `vite.config.ts` with path aliases (`$lib`, `$components`). Set up `.env` with `VITE_GOOGLE_*` vars. |
| 0.3 | TypeScript config | `tsconfig.json` strict mode. Svelte TS preprocessor. Create `src/types.ts` with all type definitions from data model above. |
| 0.4 | CSS foundation | `src/styles/variables.css` with all design tokens. `src/styles/reset.css` (minimal normalize). `src/styles/global.css` (font imports, body defaults, safe-area). Import in `src/main.ts`. |
| 0.5 | Component structure | Create empty Svelte components for each screen: `Setup.svelte`, `Tracker.svelte`, `Summary.svelte`. Create `App.svelte` with screen routing via a `$state` enum. |
| 0.6 | PWA setup | `npm install -D vite-plugin-pwa`. Configure in `vite.config.ts`: manifest (name, icons, theme color, display: standalone), workbox precaching strategy. |
| 0.7 | Cloudflare Pages config | Add `wrangler.toml` or just rely on Git-deploy pointing at `dist/`. Add `public/_headers` for cache control. Test `npm run build` → `dist/` output is clean static files. |

**Deliverable:** Empty dark-themed app shell, installable as PWA, deploys to Cloudflare Pages.

---

### Sprint 1: Match Setup Screen (1 day)

| # | Task | Details |
|---|------|---------|
| 1.1 | `Setup.svelte` layout | Full-screen view: app title/logo, form below. Centered, `max-width: 480px`. |
| 1.2 | Team name inputs | Home team input (pre-filled "FbC Pohořelice", editable). Away team input with autofocus. Large inputs (`48px` height), colored left borders (green/orange). |
| 1.3 | `PlayerRosterEditor.svelte` component | Roster editor for home team only. Scrollable list of player rows: `[jersey # input] [name input] [✕ remove btn]`. Each row is a `PlayerRow.svelte` sub-component. |
| 1.4 | Add player | "＋ Add Player" button at bottom of roster. Appends new row, focuses jersey number input, smooth `scrollIntoView`. Generate unique ID with `nanoid`. |
| 1.5 | Remove player | Tap ✕ → removes player from roster array. Svelte `transition:slide` on removal. |
| 1.6 | Roster persistence | On mount: check `localStorage` for saved roster template. If found, offer "Load previous roster?" toast. On "Start Match": save current roster to `localStorage` as template for next time. |
| 1.7 | Validation & transition | Require ≥1 home player + non-empty away team name. "Start Match →" button: initializes `MatchState` (players array + `awayShots: { onGoal: 0, blocked: 0, missed: 0 }`), sets `$state` screen to `'tracker'`. Svelte `transition:fly` between screens. |

**Design notes:**
- Jersey number input: `64px` wide, monospaced, right-aligned, numeric keyboard (`inputmode="numeric"`)
- Player rows: `bg-surface` card, slight rounded corners
- Away team: just a name input, no roster — the tracker screen handles it as a single totals card
- "Start Match" button: full-width, `accent-home` green, prominent

---

### Sprint 2: Match Tracker — Layout & Static UI (1 day)

| # | Task | Details |
|---|------|---------|
| 2.1 | `MatchHeader.svelte` | Sticky top bar. Home team name + total (left, green accent). Away team name + total (right, orange accent). Totals are large monospaced numbers. `position: sticky; top: 0; z-index: 10`. |
| 2.2 | `SubHeader.svelte` | Below header: undo button (left side, `--danger` colored icon), period selector pills (right side). Period pills: `[1] [2] [3]`, active period highlighted with `bg-elevated` + accent underline. `position: sticky; top: [header-height]`. |
| 2.3 | `PlayerCard.svelte` | The core component for home players. Props: `player: Player`. Shows: number, name, total (top row). Three shot buttons (bottom row). `2px` left border in `--accent-home` green. |
| 2.4 | `ShotButton.svelte` | Reusable button component. Props: `type: ShotType`, `count: number`. Shows icon + count (large) + label (small). Color mapped from shot type. `:active` scale transform. |
| 2.5 | `AwayTotalsCard.svelte` | Single card for away team aggregate. Shows team name + total across top. Same 3 `ShotButton` components for on-goal/blocked/missed. Styled with `--accent-away` orange accent, `2px` left border orange, slightly different background tint to visually separate from home section. |
| 2.6 | Scrollable content area | Home section label → `{#each players as player}` rendering `PlayerCard` components → divider → away section label → `AwayTotalsCard`. Single scroll container: `calc(100vh - header - subheader - bottombar)`, `overflow-y: auto`. |
| 2.7 | `BottomBar.svelte` | Fixed to bottom. "Save to Google Sheets" button. `backdrop-filter: blur(12px)`. Respects `env(safe-area-inset-bottom)`. |
| 2.8 | Responsive grid | On wider screens (`min-width: 768px`): home player cards go 2-column CSS grid; away totals card spans full width below. Phone portrait: single column throughout. |

**Design notes:**
- Header feels like a scoreboard: numbers dominate (32px mono), text secondary (14px sans)
- No tab switching — everything on one surface, less cognitive overhead during a match
- Away totals card: larger buttons than player cards (more horizontal space since no name/number column), orange-tinted `bg-surface` variant
- Undo button uses ⟲ Unicode character, `--danger` color when stack is non-empty, muted when empty

---

### Sprint 3: Match Tracker — Interactions & State (1 day)

| # | Task | Details |
|---|------|---------|
| 3.1 | State store | `src/lib/state.svelte.ts` — Svelte 5 runes-based state. Export `matchState` as `$state(...)`. Derived values: `$derived` for home team total (sum all players), away team total (sum `awayShots`), per-player totals. |
| 3.2 | Home shot recording | `PlayerCard` `ShotButton` `onclick` → calls `recordShot(playerId, 'home', type)`. Increments `player.shots[type]`, pushes `LogEntry` to `matchState.log`. |
| 3.3 | Away shot recording | `AwayTotalsCard` `ShotButton` `onclick` → calls `recordShot('away', 'away', type)`. Increments `matchState.awayShots[type]`, pushes `LogEntry` with `playerId: 'away'`. |
| 3.4 | Counter animation | On count change: add `.pulse` CSS class → `scale(1.2)` → remove after `200ms`. Use Svelte `$effect` watching the count, or a simple `setTimeout` toggle. |
| 3.5 | Header totals reactivity | `$derived` computed totals. Home total = sum of all `player.shots` across all types. Away total = sum of `awayShots`. Both always visible in header. Animate total change (same pulse). |
| 3.6 | Undo functionality | `undoLast()`: pop last `LogEntry` from `log`. If `entry.team === 'away'` → decrement `awayShots[entry.type]`. If `entry.team === 'home'` → find player by `entry.playerId`, decrement `player.shots[entry.type]`. Show toast with what was undone. |
| 3.7 | `UndoToast.svelte` | Slide-up toast from bottom: "Undone: #7 Novák — On Goal" or "Undone: SK Brno — Blocked". Svelte `transition:fly={{ y: 50, duration: 200 }}`. Auto-dismiss `3s`. Color-coded icon. |
| 3.8 | Period switching | Tap period pill → sets `matchState.currentPeriod`. New log entries use new period. **Display always shows cumulative totals.** Period is metadata for Sheets export. Active period pill gets accent highlight. |
| 3.9 | Auto-save to localStorage | `$effect` in state store: on any mutation, `JSON.stringify(matchState)` → `localStorage.setItem('matchState', ...)`. On app load: check for existing state → offer "Resume match?" dialog. |
| 3.10 | Vibration feedback | `navigator.vibrate?.(30)` in `recordShot()`. Feature-detect, no-op on iOS (not supported) or desktop. |
| 3.11 | Player quick-edit | Long-press (`pointerdown` + `setTimeout(500ms)`) on player name → inline edit mode. Name/number become `<input>`. "Done" button to confirm. Svelte `{#if editing}` conditional rendering. |

---

### Sprint 4: Google Sheets Integration (1.5 days)

| # | Task | Details |
|---|------|---------|
| 4.1 | GCP project setup guide | Write a `SETUP_GOOGLE.md` in the repo with step-by-step: create GCP project, enable Sheets API, create OAuth Client ID, create API Key, configure consent screen, set authorized origins. Include screenshots or links. |
| 4.2 | Google libs loader | `src/lib/google.ts` — dynamically load `gapi` and `google.accounts.oauth2` scripts. Return typed wrappers. Use `Promise`-based loading (not callback soup). |
| 4.3 | Auth module | `src/lib/auth.ts` — `initGoogleAuth()`: initialize token client with `VITE_GOOGLE_CLIENT_ID` and `spreadsheets` scope. `getAccessToken()`: check if token exists and is valid, if not trigger `tokenClient.requestAccessToken()`. Returns a `Promise<string>`. |
| 4.4 | Sheets write module | `src/lib/sheets.ts` — `appendMatchData(state: MatchState)`: transforms match state into two sets of rows (Matches sheet + Player Stats sheet). Calls `gapi.client.sheets.spreadsheets.values.append()` for each sheet. Uses `valueInputOption: 'USER_ENTERED'`. |
| 4.5 | Data transformation | `src/lib/transform.ts` — pure functions: `matchStateToMatchRow(state): (string|number)[][]` (one row with both team totals + away aggregate) and `matchStateToPlayerRows(state): (string|number)[][]` (home players only, with per-period breakdowns from log). Full unit-testable. |
| 4.6 | Save flow UI | Tap "Save" → `SaveConfirmation.svelte` modal overlay. Shows match summary (both teams, totals). Two buttons: "Save to Google Sheets" (primary, green) and "Cancel". On confirm: show spinner → call auth → call append → show success/error. |
| 4.7 | Auth state UI | If user hasn't signed in yet, show "Sign in with Google" step in the save flow. After first sign-in, subsequent saves in the same session skip the popup (token cached). Show signed-in email in bottom bar or settings. |
| 4.8 | Error handling | Network errors, auth failures, Sheets API errors (quota, permission denied). Show clear error messages in the modal. Retry button. If all else fails, offer JSON download fallback. |
| 4.9 | JSON fallback export | `exportAsJson(state: MatchState)`: serialize state to JSON, create Blob, trigger `<a download>` click. This is the offline safety net. |
| 4.10 | Duplicate prevention | Before appending, optionally read the last row of "Matches" sheet to check if a row with the same `matchId` already exists. If so, warn "This match was already saved. Save again?" Prevents accidental double-saves. |

### Google Sheets API — Key Technical Details

**Loading the libraries (in `google.ts`):**
```typescript
// Load GAPI client
function loadGapi(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        resolve();
      });
    };
    document.head.appendChild(script);
  });
}

// Load Google Identity Services
function loadGis(): Promise<google.accounts.oauth2.TokenClient> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: () => {}, // set dynamically per request
      });
      resolve(client);
    };
    document.head.appendChild(script);
  });
}
```

**Appending data (in `sheets.ts`):**
```typescript
async function appendToSheet(
  spreadsheetId: string,
  sheetName: string,
  rows: (string | number)[][]
): Promise<void> {
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: rows },
  });
}
```

---

### Sprint 5: Polish, PWA & Edge Cases (1 day)

| # | Task | Details |
|---|------|---------|
| 5.1 | Service worker finalize | `vite-plugin-pwa` config: precache all assets, runtime cache for Google fonts. App must work fully offline (only Sheets save requires network). |
| 5.2 | App icons & splash | Generate PWA icons (192px, 512px, maskable). Apple touch icon. Splash screen matching `--bg-primary`. Favicon. |
| 5.3 | Screen wake lock | `navigator.wakeLock.request('screen')` on tracker screen mount. Release on unmount / save. Feature-detect. Prevents phone sleeping during match. |
| 5.4 | Empty states | No players → helpful prompt with arrow pointing to "Add Player". All counts zero → save still works. Toast guidance on first launch. |
| 5.5 | Confirm destructive actions | "New Match" requires two-step confirmation. Clear data requires confirmation. Closing the app mid-match is safe (localStorage). |
| 5.6 | Undo edge cases | Undo on empty stack → muted button + subtle "Nothing to undo" toast. Cap log at 200 entries (more than any match). Undo across period switch (period is in the log entry, so it just works). |
| 5.7 | Post-match summary | `Summary.svelte`: final totals, top shooters sorted by on-goal count. "New Match" button (clears state with confirmation). "Save Again" option. "Share" → native share API for a text summary. |
| 5.8 | Performance | Audit with Lighthouse. Target: <2s first paint on 3G. Svelte already compiles small. Lazy-load Google libs (only on save). Font `display: swap`. |
| 5.9 | Accessibility | WCAG AA contrast on dark bg (verified). `aria-label` on all buttons. `role="alert"` on toasts. `aria-live="polite"` on counters. Focus management on screen transitions. |
| 5.10 | Testing | Type-check: `svelte-check`. Unit tests for `transform.ts` (data → sheet rows) with Vitest. Manual test matrix: iPhone Safari, Android Chrome, iPad Safari. |

---

### Sprint 6 (Stretch): Enhanced Features

| # | Task | Details |
|---|------|---------|
| 6.1 | Match history | `IndexedDB` (via `idb` library) for past matches. List view with date, teams, scores. Tap to view summary or re-save to Sheets. |
| 6.2 | Roster templates | Save/load multiple roster presets ("A team", "B team", "Mládež"). Stored in `localStorage` or `IndexedDB`. |
| 6.3 | Per-period view toggle | Optional toggle in tracker: show current-period-only counts vs. cumulative. Two display modes, same underlying data. |
| 6.4 | Goal tracking | Separate "Goal" button (distinct from shot-on-goal). Score display in header. Additional column in Sheets export. |
| 6.5 | Live share | Cloudflare Durable Objects WebSocket relay — second device can view live stats read-only. Stretch of a stretch. |

---

## File Structure

```
floorball-stats/
├── public/
│   ├── icons/              # PWA icons (192, 512, maskable)
│   ├── _headers            # Cloudflare Pages cache headers
│   └── favicon.svg
├── src/
│   ├── main.ts             # Entry point, mount App
│   ├── App.svelte          # Screen router ($state enum)
│   ├── vite-env.d.ts       # Vite + env type declarations
│   ├── types.ts            # All TypeScript interfaces/types
│   │
│   ├── styles/
│   │   ├── variables.css   # Design tokens
│   │   ├── reset.css       # Minimal reset
│   │   └── global.css      # Fonts, body, safe-area
│   │
│   ├── lib/
│   │   ├── state.svelte.ts # Match state (Svelte 5 runes)
│   │   ├── google.ts       # GAPI + GIS loader
│   │   ├── auth.ts         # OAuth2 token management
│   │   ├── sheets.ts       # Sheets API append calls
│   │   ├── transform.ts    # State → sheet rows (pure functions)
│   │   └── storage.ts      # localStorage helpers
│   │
│   ├── components/
│   │   ├── screens/
│   │   │   ├── Setup.svelte
│   │   │   ├── Tracker.svelte
│   │   │   └── Summary.svelte
│   │   ├── tracker/
│   │   │   ├── MatchHeader.svelte
│   │   │   ├── SubHeader.svelte
│   │   │   ├── PlayerCard.svelte
│   │   │   ├── ShotButton.svelte
│   │   │   ├── AwayTotalsCard.svelte
│   │   │   └── BottomBar.svelte
│   │   ├── setup/
│   │   │   ├── PlayerRosterEditor.svelte
│   │   │   └── PlayerRow.svelte
│   │   └── shared/
│   │       ├── UndoToast.svelte
│   │       ├── SaveConfirmation.svelte
│   │       ├── ConfirmDialog.svelte
│   │       └── Toast.svelte
│   │
│   └── tests/
│       └── transform.test.ts
│
├── .env                    # VITE_GOOGLE_* variables
├── .env.example            # Template without real values
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── SETUP_GOOGLE.md         # GCP setup guide
└── README.md
```

---

## Estimated Timeline

| Sprint | Duration | Cumulative |
|--------|----------|------------|
| Sprint 0: Scaffolding | 0.5 day | 0.5 days |
| Sprint 1: Setup Screen | 1 day | 1.5 days |
| Sprint 2: Tracker Layout | 1 day | 2.5 days |
| Sprint 3: Tracker Interactions | 1 day | 3.5 days |
| Sprint 4: Google Sheets Integration | 1.5 days | 5 days |
| Sprint 5: Polish & PWA | 1 day | 6 days |
| Sprint 6: Stretch features | 1–3 days | 7–9 days |

**Total core: ~6 working days for a senior dev.**

---

## One-Time Setup Checklist

Before starting Sprint 0:

- [ ] Create Google Cloud project at console.cloud.google.com
- [ ] Enable Google Sheets API
- [ ] Create OAuth 2.0 Client ID (Web application)
  - Authorized JS origins: `http://localhost:5173` + your CF Pages domain
- [ ] Create API Key (restrict to Sheets API + your domains)
- [ ] Create the target Google Sheet with two tabs: "Matches" and "Player Stats"
  - Add header rows matching the column structure defined above
  - Share the sheet with yourself (the OAuth user)
- [ ] Note the Sheet ID from the URL (the long string between `/d/` and `/edit`)
- [ ] Create Cloudflare Pages project linked to your Git repo
  - Build command: `npm run build`
  - Output directory: `dist`
