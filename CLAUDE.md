# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile-first PWA for live floorball match statistics tracking. Records shots (on-goal, blocked, missed) per player per period and exports to Google Sheets. No backend — fully browser-based with Google Identity Services for OAuth2.

## Commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run type-check   # svelte-check type validation
npm run test         # Vitest unit tests (transform.ts)
```

> Note: The project is currently in spec phase. Run `npm create svelte@latest` / Vite scaffolding before these commands work. See `docs/ROADMAP.md` Sprint 0.

## Architecture

**Stack:** Svelte 5 (runes), TypeScript strict, Vite 6, vite-plugin-pwa, Cloudflare Pages hosting.

### State (`src/lib/state.svelte.ts`)
Single `MatchState` object managed with Svelte 5 runes. `$derived` computes aggregates. `$effect` auto-persists to `localStorage` for crash recovery. Away team is aggregate-only (no individual players).

### Screens (3)
`Setup.svelte` → `Tracker.svelte` → `Summary.svelte`. Tracker is composed of sub-components: `MatchHeader`, `SubHeader`, `PlayerCard`, `ShotButton`, `AwayTotalsCard`, `BottomBar`.

### Google Sheets Integration (no backend)
- `src/lib/google.ts` — GAPI + GIS loader
- `src/lib/auth.ts` — OAuth2 PKCE token management
- `src/lib/sheets.ts` — Sheets API v4 append calls
- `src/lib/transform.ts` — Pure functions: `MatchState` → sheet rows (unit tested)

Appends to two sheets: **"Matches"** (match metadata) and **"Player Stats"** (per-player data with period breakdowns derived from the log).

### Data Model Key Points
- `log: LogEntry[]` is both the event log and the undo stack
- Per-period breakdowns are computed from the log at export time, not stored separately
- `Player.shots` counts are derived/cached from the log for display performance

## Design System

**"Dark Arena"** aesthetic — sports broadcast scoreboard.

| Token | Value |
|---|---|
| Primary BG | `#0A0E17` |
| Surface | `#141A28` |
| Text | `#E8ECF4` |
| Home accent | `#22D68A` (green) |
| Away accent | `#F06449` (orange) |

**Fonts:** JetBrains Mono (numbers/scores), DM Sans (labels).
**Touch targets:** 48px minimum, shot buttons 56px tall.

## Key Files

- `docs/ROADMAP.md` — Full spec: sprint plan, data model interfaces, Sheets schema, GCP setup checklist, file structure blueprint. Read this before starting any sprint.
- `src/types.ts` — TypeScript interfaces (`Player`, `LogEntry`, `MatchState`, `SheetsConfig`)
- `src/lib/transform.ts` — The only file with unit tests
- test
