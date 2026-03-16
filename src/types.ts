export type ShotType = 'onGoal' | 'blocked' | 'missed';
export type TeamSide = 'home' | 'away';
export type Period = 1 | 2 | 3;

export interface ShotCounts {
  onGoal: number;
  blocked: number;
  missed: number;
}

export interface Player {
  id: string;
  number: number | null;
  name: string;
  shots: ShotCounts;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  period: Period;
  team: TeamSide;
  playerId?: string;
  shotType: ShotType;
}

export interface MatchState {
  matchId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  currentPeriod: Period;
  players: Player[];
  awayShots: ShotCounts;
  log: LogEntry[];
}

export interface SheetsConfig {
  clientId: string;
  apiKey: string;
  sheetId: string;
}
