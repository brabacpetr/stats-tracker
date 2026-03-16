<script lang="ts">
  import { onMount } from 'svelte';
  import { nanoid } from 'nanoid';
  import type { MatchState, Player } from '../../types';
  import { saveRosterTemplate, loadRosterTemplate } from '../../lib/storage';
  import PlayerRosterEditor from '../setup/PlayerRosterEditor.svelte';

  interface Props {
    onStart: (state: MatchState) => void;
  }

  let { onStart }: Props = $props();

  let homeTeam = $state('Panthers');
  let awayTeam = $state('');
  let players = $state<Player[]>([]);
  let awayTeamError = $state('');
  let playersError = $state('');
  let toast = $state('');
  let toastTimer: ReturnType<typeof setTimeout>;

  const isValid = $derived(awayTeam.trim().length > 0 && players.length > 0);

  onMount(() => {
    const saved = loadRosterTemplate();
    if (saved && saved.length > 0) {
      players = saved;
      showToast('Loaded previous roster');
    }
  });

  function showToast(msg: string) {
    toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 2500);
  }

  function handleStart() {
    awayTeamError = '';
    playersError = '';

    let valid = true;
    if (!awayTeam.trim()) {
      awayTeamError = 'Away team name is required';
      valid = false;
    }
    if (players.length === 0) {
      playersError = 'Add at least one home player';
      valid = false;
    }

    if (!valid) return;

    saveRosterTemplate(players);

    const state: MatchState = {
      matchId: nanoid(),
      date: new Date().toISOString().slice(0, 10),
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      currentPeriod: 1,
      players: players.map((p) => ({
        ...p,
        shots: { onGoal: 0, blocked: 0, missed: 0 },
      })),
      awayShots: { onGoal: 0, blocked: 0, missed: 0 },
      log: [],
    };

    onStart(state);
  }

  function handlePlayersUpdate(updated: Player[]) {
    players = updated;
    if (updated.length > 0) playersError = '';
  }
</script>

<div class="setup-screen">
  <header class="app-header">
    <div class="logo">⬡</div>
    <h1 class="app-title">Floorball Stats</h1>
    <p class="app-subtitle">Match Setup</p>
  </header>

  <main class="setup-form">
    <section class="section">
      <label class="field-label" for="home-team">Home Team</label>
      <input
        id="home-team"
        class="team-input home"
        type="text"
        placeholder="Home team name"
        bind:value={homeTeam}
      />
    </section>

    <section class="section">
      <label class="field-label" for="away-team">Away Team</label>
      <input
        id="away-team"
        class="team-input away"
        type="text"
        placeholder="Away team name"
        bind:value={awayTeam}
        oninput={() => (awayTeamError = '')}
      />
      {#if awayTeamError}
        <p class="field-error">{awayTeamError}</p>
      {/if}
    </section>

    <section class="section">
      <div class="section-header">
        <span class="section-label">Home Players</span>
        <span class="player-count">{players.length} player{players.length !== 1 ? 's' : ''}</span>
      </div>
      <PlayerRosterEditor {players} onUpdate={handlePlayersUpdate} />
      {#if playersError}
        <p class="field-error">{playersError}</p>
      {/if}
    </section>
  </main>

  <footer class="setup-footer">
    <button class="start-btn" onclick={handleStart} disabled={false}>
      Start Match →
    </button>
  </footer>

  {#if toast}
    <div class="toast" role="status" aria-live="polite">{toast}</div>
  {/if}
</div>

<style>
  .setup-screen {
    max-width: var(--max-width);
    margin: 0 auto;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: var(--space-6) var(--space-4) var(--space-4);
  }

  .app-header {
    text-align: center;
    margin-bottom: var(--space-8);
  }

  .logo {
    font-size: 2.5rem;
    color: var(--accent-home);
    line-height: 1;
    margin-bottom: var(--space-2);
  }

  .app-title {
    font-family: var(--font-sans);
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: -0.02em;
  }

  .app-subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .setup-form {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .field-label,
  .section-label {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .player-count {
    font-size: var(--text-xs);
    color: var(--color-text-dim);
    font-family: var(--font-mono);
  }

  .team-input {
    height: var(--touch-target);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    font-weight: 500;
    padding: 0 var(--space-4);
    outline: none;
    transition: border-color var(--transition-fast);
    border-left-width: 3px;
  }

  .team-input:focus {
    border-color: var(--color-text-muted);
  }

  .team-input.home {
    border-left-color: var(--accent-home);
  }

  .team-input.home:focus {
    border-color: var(--accent-home);
  }

  .team-input.away {
    border-left-color: var(--accent-away);
  }

  .team-input.away:focus {
    border-color: var(--accent-away);
  }

  .team-input::placeholder {
    color: var(--color-text-dim);
  }

  .field-error {
    font-size: var(--text-sm);
    color: var(--danger);
    margin-top: var(--space-1);
  }

  .setup-footer {
    padding-top: var(--space-6);
    padding-bottom: var(--space-4);
  }

  .start-btn {
    width: 100%;
    height: 56px;
    background: var(--accent-home);
    color: #0A0E17;
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    font-weight: 700;
    border-radius: var(--border-radius-lg);
    letter-spacing: 0.02em;
    transition: opacity var(--transition-fast), transform var(--transition-fast);
  }

  .start-btn:hover {
    opacity: 0.9;
  }

  .start-btn:active {
    transform: scale(0.98);
  }

  .start-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .toast {
    position: fixed;
    bottom: calc(var(--space-8) + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: var(--text-sm);
    padding: var(--space-3) var(--space-5);
    border-radius: 999px;
    white-space: nowrap;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }
</style>
