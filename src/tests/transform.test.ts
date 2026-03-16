import { describe, it, expect } from 'vitest';
import { matchStateToMatchRow, matchStateToPlayerRows } from '../lib/transform.js';
import type { MatchState } from '../types.js';

const baseState: MatchState = {
  matchId: 'test-match-1',
  date: '2026-03-16',
  homeTeam: 'FbC Pohořelice',
  awayTeam: 'SK Brno',
  currentPeriod: 3,
  players: [
    {
      id: 'p1',
      number: 7,
      name: 'Novák',
      shots: { onGoal: 3, blocked: 2, missed: 1 },
    },
    {
      id: 'p2',
      number: 12,
      name: 'Dvořák',
      shots: { onGoal: 1, blocked: 0, missed: 0 },
    },
  ],
  awayShots: { onGoal: 5, blocked: 2, missed: 1 },
  log: [
    // Period 1: Novák — 1 onGoal, 1 blocked
    { id: 'l1', timestamp: 1000, period: 1, team: 'home', playerId: 'p1', shotType: 'onGoal' },
    { id: 'l2', timestamp: 2000, period: 1, team: 'home', playerId: 'p1', shotType: 'blocked' },
    // Period 2: Novák — 1 onGoal, 1 blocked; Dvořák — 1 onGoal
    { id: 'l3', timestamp: 3000, period: 2, team: 'home', playerId: 'p1', shotType: 'onGoal' },
    { id: 'l4', timestamp: 4000, period: 2, team: 'home', playerId: 'p1', shotType: 'blocked' },
    { id: 'l5', timestamp: 5000, period: 2, team: 'home', playerId: 'p2', shotType: 'onGoal' },
    // Period 3: Novák — 1 onGoal, 1 missed; away — 5 onGoal, 2 blocked, 1 missed
    { id: 'l6', timestamp: 6000, period: 3, team: 'home', playerId: 'p1', shotType: 'onGoal' },
    { id: 'l7', timestamp: 7000, period: 3, team: 'home', playerId: 'p1', shotType: 'missed' },
    { id: 'l8', timestamp: 8000, period: 3, team: 'away', playerId: 'away', shotType: 'onGoal' },
  ],
};

describe('matchStateToMatchRow', () => {
  it('returns a single row wrapped in an array', () => {
    const result = matchStateToMatchRow(baseState);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(11);
  });

  it('has correct date, home team, away team', () => {
    const [row] = matchStateToMatchRow(baseState);
    expect(row[0]).toBe('2026-03-16');
    expect(row[1]).toBe('FbC Pohořelice');
    expect(row[2]).toBe('SK Brno');
  });

  it('calculates home and away totals correctly', () => {
    const [row] = matchStateToMatchRow(baseState);
    // Novák: 3+2+1=6, Dvořák: 1+0+0=1 → home total = 7
    expect(row[3]).toBe(7); // homeTotal
    // Away: 5+2+1=8
    expect(row[4]).toBe(8); // awayTotal
  });

  it('calculates home breakdown correctly', () => {
    const [row] = matchStateToMatchRow(baseState);
    // Novák: 3og, Dvořák: 1og → 4 total onGoal
    expect(row[5]).toBe(4); // homeOnGoal
    expect(row[6]).toBe(2); // homeBlocked (Novák only)
    expect(row[7]).toBe(1); // homeMissed (Novák only)
  });

  it('includes away breakdown from awayShots', () => {
    const [row] = matchStateToMatchRow(baseState);
    expect(row[8]).toBe(5);  // awayOnGoal
    expect(row[9]).toBe(2);  // awayBlocked
    expect(row[10]).toBe(1); // awayMissed
  });

  it('handles a state with no shots', () => {
    const empty: MatchState = {
      ...baseState,
      players: [{ id: 'p1', number: 7, name: 'Novák', shots: { onGoal: 0, blocked: 0, missed: 0 } }],
      awayShots: { onGoal: 0, blocked: 0, missed: 0 },
      log: [],
    };
    const [row] = matchStateToMatchRow(empty);
    expect(row[3]).toBe(0);
    expect(row[4]).toBe(0);
  });
});

describe('matchStateToPlayerRows', () => {
  it('returns one row per home player', () => {
    const result = matchStateToPlayerRows(baseState);
    expect(result).toHaveLength(2);
  });

  it('each row has 17 columns', () => {
    const result = matchStateToPlayerRows(baseState);
    for (const row of result) {
      expect(row).toHaveLength(17);
    }
  });

  it('Novák row has correct basic stats', () => {
    const [novakRow] = matchStateToPlayerRows(baseState);
    expect(novakRow[0]).toBe('2026-03-16'); // date
    expect(novakRow[1]).toBe('SK Brno');    // away team
    expect(novakRow[2]).toBe(7);            // jersey number
    expect(novakRow[3]).toBe('Novák');      // name
    expect(novakRow[4]).toBe(3);            // onGoal
    expect(novakRow[5]).toBe(2);            // blocked
    expect(novakRow[6]).toBe(1);            // missed
    expect(novakRow[7]).toBe(6);            // total
  });

  it('Novák row has correct per-period breakdown from log', () => {
    const [novakRow] = matchStateToPlayerRows(baseState);
    // On Goal per period: P1=1, P2=1, P3=1
    expect(novakRow[8]).toBe(1);  // OG P1
    expect(novakRow[9]).toBe(1);  // OG P2
    expect(novakRow[10]).toBe(1); // OG P3
    // Blocked per period: P1=1, P2=1, P3=0
    expect(novakRow[11]).toBe(1); // Bl P1
    expect(novakRow[12]).toBe(1); // Bl P2
    expect(novakRow[13]).toBe(0); // Bl P3
    // Missed per period: P1=0, P2=0, P3=1
    expect(novakRow[14]).toBe(0); // Mi P1
    expect(novakRow[15]).toBe(0); // Mi P2
    expect(novakRow[16]).toBe(1); // Mi P3
  });

  it('Dvořák row has correct basic stats', () => {
    const result = matchStateToPlayerRows(baseState);
    const dvorakRow = result[1];
    expect(dvorakRow[3]).toBe('Dvořák');
    expect(dvorakRow[4]).toBe(1);  // onGoal
    expect(dvorakRow[5]).toBe(0);  // blocked
    expect(dvorakRow[6]).toBe(0);  // missed
    expect(dvorakRow[7]).toBe(1);  // total
  });

  it('Dvořák per-period: 1 onGoal in P2, 0 elsewhere', () => {
    const result = matchStateToPlayerRows(baseState);
    const dvorakRow = result[1];
    expect(dvorakRow[8]).toBe(0);  // OG P1
    expect(dvorakRow[9]).toBe(1);  // OG P2
    expect(dvorakRow[10]).toBe(0); // OG P3
    expect(dvorakRow[11]).toBe(0); // Bl P1
    expect(dvorakRow[12]).toBe(0); // Bl P2
    expect(dvorakRow[13]).toBe(0); // Bl P3
  });

  it('away log entries do not affect home player breakdowns', () => {
    // l8 is an away shot in P3, should not appear in any player row
    const result = matchStateToPlayerRows(baseState);
    const novakRow = result[0];
    // Novák P3 onGoal should still be 1 (from l6 only)
    expect(novakRow[10]).toBe(1);
  });

  it('uses empty string for null jersey number', () => {
    const state: MatchState = {
      ...baseState,
      players: [{ id: 'p1', number: null, name: 'Anon', shots: { onGoal: 0, blocked: 0, missed: 0 } }],
      log: [],
    };
    const [row] = matchStateToPlayerRows(state);
    expect(row[2]).toBe('');
  });
});
