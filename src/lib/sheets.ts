import { initGoogleAuth, getAccessToken } from './auth.js';
import { matchStateToMatchRow, matchStateToPlayerRows } from './transform.js';
import type { MatchState } from '../types.js';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

async function appendToSheet(sheetName: string, rows: (string | number)[][]): Promise<void> {
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: rows },
  });
}

/**
 * Authenticates the user (if needed) and appends match data to both
 * the "Matches" and "Player Stats" sheets.
 */
export async function appendMatchData(state: MatchState): Promise<void> {
  await initGoogleAuth();
  await getAccessToken();

  const matchRows = matchStateToMatchRow(state);
  const playerRows = matchStateToPlayerRows(state);

  await appendToSheet('Matches', matchRows);
  await appendToSheet('Player Stats', playerRows);
}
