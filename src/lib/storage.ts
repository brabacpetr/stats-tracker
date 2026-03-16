import type { Player, MatchState } from '../types';

const ROSTER_KEY = 'rosterTemplate';
const MATCH_KEY = 'matchState';

export function saveRosterTemplate(players: Player[]): void {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(players));
}

export function loadRosterTemplate(): Player[] | null {
  const raw = localStorage.getItem(ROSTER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Player[];
  } catch {
    return null;
  }
}

export function saveMatchState(state: MatchState): void {
  localStorage.setItem(MATCH_KEY, JSON.stringify(state));
}

export function loadMatchState(): MatchState | null {
  const raw = localStorage.getItem(MATCH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MatchState;
  } catch {
    return null;
  }
}

export function clearMatchState(): void {
  localStorage.removeItem(MATCH_KEY);
}
