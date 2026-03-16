import { nanoid } from 'nanoid';
import type { LogEntry, MatchState, Period, ShotType } from '../types.js';
import { saveMatchState } from './storage.js';

export interface UndoneInfo {
  team: 'home' | 'away';
  playerName?: string;
  playerNumber?: number | null;
  awayTeam?: string;
  shotType: ShotType;
}

class MatchStore {
  matchState = $state<MatchState | null>(null);
  lastUndone = $state<UndoneInfo | null>(null);

  get homeTotal(): number {
    if (!this.matchState) return 0;
    return this.matchState.players.reduce(
      (sum, p) => sum + p.shots.onGoal + p.shots.blocked + p.shots.missed,
      0
    );
  }

  get awayTotal(): number {
    if (!this.matchState) return 0;
    const s = this.matchState.awayShots;
    return s.onGoal + s.blocked + s.missed;
  }

  get canUndo(): boolean {
    return (this.matchState?.log.length ?? 0) > 0;
  }

  initMatch(state: MatchState) {
    this.matchState = state;
  }

  recordShot(team: 'home' | 'away', playerId: string, type: ShotType) {
    if (!this.matchState) return;

    if (team === 'home') {
      this.matchState.players = this.matchState.players.map((p) =>
        p.id === playerId
          ? { ...p, shots: { ...p.shots, [type]: p.shots[type] + 1 } }
          : p
      );
    } else {
      this.matchState.awayShots = {
        ...this.matchState.awayShots,
        [type]: this.matchState.awayShots[type] + 1,
      };
    }

    const entry: LogEntry = {
      id: nanoid(),
      timestamp: Date.now(),
      period: this.matchState.currentPeriod,
      team,
      playerId,
      shotType: type,
    };

    this.matchState.log = [...this.matchState.log, entry];
    navigator.vibrate?.(30);
    saveMatchState(this.matchState);
  }

  undoLast() {
    if (!this.matchState || this.matchState.log.length === 0) return;

    const log = [...this.matchState.log];
    const last = log.pop()!;

    if (last.team === 'away') {
      this.matchState.awayShots = {
        ...this.matchState.awayShots,
        [last.shotType]: Math.max(0, this.matchState.awayShots[last.shotType] - 1),
      };
      this.lastUndone = {
        team: 'away',
        awayTeam: this.matchState.awayTeam,
        shotType: last.shotType,
      };
    } else if (last.playerId) {
      const player = this.matchState.players.find((p) => p.id === last.playerId);
      this.matchState.players = this.matchState.players.map((p) =>
        p.id === last.playerId
          ? { ...p, shots: { ...p.shots, [last.shotType]: Math.max(0, p.shots[last.shotType] - 1) } }
          : p
      );
      this.lastUndone = {
        team: 'home',
        playerName: player?.name,
        playerNumber: player?.number,
        shotType: last.shotType,
      };
    }

    this.matchState.log = log;
    saveMatchState(this.matchState);
  }

  changePeriod(p: Period) {
    if (!this.matchState) return;
    this.matchState.currentPeriod = p;
    saveMatchState(this.matchState);
  }

  updatePlayer(playerId: string, updates: { name?: string; number?: number | null }) {
    if (!this.matchState) return;
    this.matchState.players = this.matchState.players.map((p) =>
      p.id === playerId ? { ...p, ...updates } : p
    );
    saveMatchState(this.matchState);
  }

  clearLastUndone() {
    this.lastUndone = null;
  }
}

export const matchStore = new MatchStore();
