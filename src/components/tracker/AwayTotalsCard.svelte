<script lang="ts">
  import type { ShotCounts, ShotType } from '../../types';
  import ShotButton from './ShotButton.svelte';

  interface Props {
    awayTeam: string;
    awayShots: ShotCounts;
    onShot: (type: ShotType) => void;
  }

  let { awayTeam, awayShots, onShot }: Props = $props();

  const total = $derived(awayShots.onGoal + awayShots.blocked + awayShots.missed);
</script>

<div class="away-card">
  <div class="away-header">
    <span class="away-label">Away</span>
    <span class="away-name">{awayTeam}</span>
    <span class="away-total">Σ {total}</span>
  </div>
  <div class="shot-buttons">
    <ShotButton type="onGoal" count={awayShots.onGoal} size="large" onclick={() => onShot('onGoal')} />
    <ShotButton type="blocked" count={awayShots.blocked} size="large" onclick={() => onShot('blocked')} />
    <ShotButton type="missed" count={awayShots.missed} size="large" onclick={() => onShot('missed')} />
  </div>
</div>

<style>
  .away-card {
    background: var(--color-surface);
    border-radius: var(--border-radius);
    border-left: 2px solid var(--accent-away);
    overflow: hidden;
  }

  .away-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-3) var(--space-2);
  }

  .away-label {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent-away);
    opacity: 0.7;
  }

  .away-name {
    flex: 1;
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .away-total {
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text-muted);
  }

  .shot-buttons {
    display: flex;
    gap: var(--space-1);
    padding: 0 var(--space-2) var(--space-2);
  }

  /* Tint the shot buttons with orange context */
  .away-card :global(.shot-btn--onGoal) {
    background: color-mix(in srgb, var(--shot-on-goal-dim) 70%, var(--accent-away-dim) 30%);
  }
</style>
