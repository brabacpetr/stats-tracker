import type { MatchState, ShotType } from '../types.js';

/**
 * Converts MatchState to a single row for the "Matches" sheet.
 * Columns: Date | Home Team | Away Team | Home Total | Away Total |
 *          Home On Goal | Home Blocked | Home Missed |
 *          Away On Goal | Away Blocked | Away Missed
 */
export function matchStateToMatchRow(state: MatchState): (string | number)[][] {
  const homeOnGoal = state.players.reduce((sum, p) => sum + p.shots.onGoal, 0);
  const homeBlocked = state.players.reduce((sum, p) => sum + p.shots.blocked, 0);
  const homeMissed = state.players.reduce((sum, p) => sum + p.shots.missed, 0);
  const homeTotal = homeOnGoal + homeBlocked + homeMissed;
  const awayTotal = state.awayShots.onGoal + state.awayShots.blocked + state.awayShots.missed;

  return [[
    state.date,
    state.homeTeam,
    state.awayTeam,
    homeTotal,
    awayTotal,
    homeOnGoal,
    homeBlocked,
    homeMissed,
    state.awayShots.onGoal,
    state.awayShots.blocked,
    state.awayShots.missed,
  ]];
}

/**
 * Converts MatchState to rows for the "Player Stats" sheet.
 * One row per home player.
 * Columns: Date | Match (vs) | # | Player | On Goal | Blocked | Missed | Total |
 *          OG P1 | OG P2 | OG P3 | Bl P1 | Bl P2 | Bl P3 | Mi P1 | Mi P2 | Mi P3
 */
export function matchStateToPlayerRows(state: MatchState): (string | number)[][] {
  // Build per-player, per-period breakdowns from the event log
  type PerPeriod = Record<number, Record<ShotType, number>>;
  const breakdown = new Map<string, PerPeriod>();

  for (const player of state.players) {
    breakdown.set(player.id, {
      1: { onGoal: 0, blocked: 0, missed: 0 },
      2: { onGoal: 0, blocked: 0, missed: 0 },
      3: { onGoal: 0, blocked: 0, missed: 0 },
    });
  }

  for (const entry of state.log) {
    if (entry.team !== 'home' || !entry.playerId) continue;
    const playerBreakdown = breakdown.get(entry.playerId);
    if (!playerBreakdown) continue;
    playerBreakdown[entry.period][entry.shotType]++;
  }

  return state.players.map((player) => {
    const p = breakdown.get(player.id)!;
    const total = player.shots.onGoal + player.shots.blocked + player.shots.missed;

    return [
      state.date,
      state.awayTeam,
      player.number ?? '',
      player.name,
      player.shots.onGoal,
      player.shots.blocked,
      player.shots.missed,
      total,
      p[1].onGoal,
      p[2].onGoal,
      p[3].onGoal,
      p[1].blocked,
      p[2].blocked,
      p[3].blocked,
      p[1].missed,
      p[2].missed,
      p[3].missed,
    ];
  });
}

/**
 * Serializes MatchState to a JSON blob and triggers a browser download.
 */
export function exportAsJson(state: MatchState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `match_${state.date}_${state.homeTeam}_vs_${state.awayTeam}.json`.replace(/\s+/g, '_');
  a.click();
  URL.revokeObjectURL(url);
}
