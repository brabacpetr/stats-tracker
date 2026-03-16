<script lang="ts">
  import { matchStore } from '../../lib/state.svelte.js';
  import { exportAsJson } from '../../lib/transform.js';
  import { clearMatchState } from '../../lib/storage.js';
  import type { Player } from '../../types.js';

  interface Props {
    onNewMatch?: () => void;
  }

  let { onNewMatch }: Props = $props();

  let confirmingNew = $state(false);

  const matchData = $derived(matchStore.matchState);

  const homeTotal = $derived(matchStore.homeTotal);
  const awayTotal = $derived(matchStore.awayTotal);

  const sortedPlayers = $derived<Player[]>(
    matchData
      ? [...matchData.players].sort(
          (a, b) =>
            b.shots.onGoal + b.shots.blocked + b.shots.missed -
            (a.shots.onGoal + a.shots.blocked + a.shots.missed)
        )
      : []
  );

  function handleNewMatch() {
    if (!confirmingNew) {
      confirmingNew = true;
      return;
    }
    clearMatchState();
    matchStore.initMatch(null as never);
    onNewMatch?.();
  }

  function handleShare() {
    if (!matchData) return;
    const text =
      `${matchData.homeTeam} vs ${matchData.awayTeam} — ${matchData.date}\n` +
      `Home shots: ${homeTotal} | Away shots: ${awayTotal}\n` +
      matchData.players
        .sort((a, b) =>
          b.shots.onGoal + b.shots.blocked + b.shots.missed -
          (a.shots.onGoal + a.shots.blocked + a.shots.missed)
        )
        .map((p) => {
          const t = p.shots.onGoal + p.shots.blocked + p.shots.missed;
          return `  #${p.number ?? '?'} ${p.name}: ${t} shots (${p.shots.onGoal} on goal)`;
        })
        .join('\n');

    if (navigator.share) {
      navigator.share({ title: 'Match Stats', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  }
</script>

<div class="summary-screen">
  {#if matchData}
    <header class="summary-header">
      <div class="header-meta">{matchData.date}</div>
      <h1 class="match-title">
        <span class="home-team">{matchData.homeTeam}</span>
        <span class="vs">vs</span>
        <span class="away-team">{matchData.awayTeam}</span>
      </h1>
      <div class="total-shots">
        <span class="total home">{homeTotal}</span>
        <span class="total-label">shots</span>
        <span class="total away">{awayTotal}</span>
      </div>
    </header>

    <section class="section">
      <h2 class="section-title">Away Team Totals</h2>
      <div class="away-totals-card">
        <div class="stat-group">
          <span class="stat-value on-goal">{matchData.awayShots.onGoal}</span>
          <span class="stat-label">On Goal</span>
        </div>
        <div class="stat-group">
          <span class="stat-value blocked">{matchData.awayShots.blocked}</span>
          <span class="stat-label">Blocked</span>
        </div>
        <div class="stat-group">
          <span class="stat-value missed">{matchData.awayShots.missed}</span>
          <span class="stat-label">Missed</span>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Home Players</h2>
      <div class="player-list">
        {#each sortedPlayers as player (player.id)}
          {@const total = player.shots.onGoal + player.shots.blocked + player.shots.missed}
          <div class="player-row">
            <div class="player-identity">
              {#if player.number !== null}
                <span class="jersey">#{player.number}</span>
              {/if}
              <span class="player-name">{player.name}</span>
            </div>
            <div class="player-stats">
              <span class="shot-stat on-goal" title="On Goal">{player.shots.onGoal}</span>
              <span class="shot-sep">/</span>
              <span class="shot-stat blocked" title="Blocked">{player.shots.blocked}</span>
              <span class="shot-sep">/</span>
              <span class="shot-stat missed" title="Missed">{player.shots.missed}</span>
              <span class="player-total">{total}</span>
            </div>
          </div>
        {/each}
      </div>
      <p class="stat-legend">On Goal / Blocked / Missed</p>
    </section>

    <div class="actions">
      <button class="btn-secondary" onclick={handleShare}>
        Share Summary
      </button>
      <button class="btn-secondary" onclick={() => exportAsJson(matchData!)}>
        Download JSON
      </button>
      <button
        class="btn-new-match"
        class:confirm={confirmingNew}
        onclick={handleNewMatch}
        onblur={() => (confirmingNew = false)}
      >
        {confirmingNew ? 'Tap again to confirm' : 'New Match'}
      </button>
    </div>
  {/if}
</div>

<style>
  .summary-screen {
    min-height: 100dvh;
    background: var(--color-bg);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6) var(--space-4);
    padding-bottom: calc(var(--space-8) + env(safe-area-inset-bottom));
    max-width: var(--max-width);
    margin: 0 auto;
  }

  /* Header */
  .summary-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-6) 0 var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .header-meta {
    font-size: var(--text-xs);
    color: var(--color-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .match-title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-sans);
    font-size: var(--text-xl);
    font-weight: 700;
    margin: 0;
    text-align: center;
    flex-wrap: wrap;
    justify-content: center;
  }

  .home-team { color: var(--accent-home); }
  .away-team { color: var(--accent-away); }
  .vs {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-weight: 400;
  }

  .total-shots {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .total {
    font-family: var(--font-mono);
    font-size: var(--text-4xl);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .total.home { color: var(--accent-home); }
  .total.away { color: var(--accent-away); }

  .total-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Section */
  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .section-title {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-dim);
    margin: 0;
  }

  /* Away totals */
  .away-totals-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-left: 3px solid var(--accent-away);
    border-radius: var(--border-radius);
    padding: var(--space-4);
    display: flex;
    justify-content: space-around;
    gap: var(--space-4);
  }

  .stat-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .stat-value {
    font-family: var(--font-mono);
    font-size: var(--text-3xl);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .stat-value.on-goal { color: var(--shot-on-goal); }
  .stat-value.blocked { color: var(--shot-blocked); }
  .stat-value.missed { color: var(--shot-missed); }

  .stat-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Player list */
  .player-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .player-row {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-left: 3px solid var(--accent-home);
    border-radius: var(--border-radius);
    padding: var(--space-3) var(--space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .player-identity {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .jersey {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 28px;
  }

  .player-name {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-stats {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .shot-stat {
    font-family: var(--font-mono);
    font-size: var(--text-base);
    font-variant-numeric: tabular-nums;
    min-width: 18px;
    text-align: center;
  }

  .shot-stat.on-goal { color: var(--shot-on-goal); }
  .shot-stat.blocked { color: var(--shot-blocked); }
  .shot-stat.missed { color: var(--shot-missed); }

  .shot-sep {
    color: var(--color-border);
    font-size: var(--text-xs);
  }

  .player-total {
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text);
    min-width: 28px;
    text-align: right;
    margin-left: var(--space-2);
  }

  .stat-legend {
    font-size: var(--text-xs);
    color: var(--color-text-dim);
    text-align: center;
    margin: 0;
  }

  /* Actions */
  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: auto;
  }

  .btn-secondary {
    height: var(--touch-target);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 500;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .btn-secondary:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }

  .btn-new-match {
    height: var(--touch-target);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: 600;
    transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  }

  .btn-new-match:hover {
    background: var(--color-surface-raised);
    border-color: var(--accent-home);
    color: var(--accent-home);
  }

  .btn-new-match.confirm {
    background: var(--danger-dim);
    border-color: var(--danger);
    color: var(--danger);
  }
</style>
