<script lang="ts">
  import { fly } from 'svelte/transition';
  import { matchStore } from '../../lib/state.svelte.js';

  const SHOT_LABELS: Record<string, string> = {
    onGoal: 'On Goal',
    blocked: 'Blocked',
    missed: 'Missed',
  };

  let visible = $state(false);
  let dismissTimer: ReturnType<typeof setTimeout>;

  $effect(() => {
    if (matchStore.lastUndone) {
      visible = true;
      clearTimeout(dismissTimer);
      dismissTimer = setTimeout(() => dismiss(), 3000);
    }
  });

  function dismiss() {
    visible = false;
    clearTimeout(dismissTimer);
    setTimeout(() => matchStore.clearLastUndone(), 220);
  }
</script>

{#if visible && matchStore.lastUndone}
  <div
    class="undo-toast"
    transition:fly={{ y: 60, duration: 200 }}
    role="alert"
    aria-live="assertive"
  >
    <span class="undo-icon">⟲</span>
    <span class="undo-text">
      {#if matchStore.lastUndone.team === 'away'}
        Undone: {matchStore.lastUndone.awayTeam} — {SHOT_LABELS[matchStore.lastUndone.shotType]}
      {:else}
        Undone:
        {matchStore.lastUndone.playerNumber != null
          ? `#${matchStore.lastUndone.playerNumber} `
          : ''}{matchStore.lastUndone.playerName || 'Player'}
        — {SHOT_LABELS[matchStore.lastUndone.shotType]}
      {/if}
    </span>
    <button class="dismiss-btn" onclick={dismiss} aria-label="Dismiss toast">×</button>
  </div>
{/if}

<style>
  .undo-toast {
    position: fixed;
    bottom: calc(72px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-left: 3px solid var(--danger);
    color: var(--color-text);
    font-size: var(--text-sm);
    font-family: var(--font-sans);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--border-radius);
    white-space: nowrap;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
    z-index: 100;
    max-width: calc(100vw - var(--space-8));
  }

  .undo-icon {
    color: var(--danger);
    font-size: var(--text-base);
    flex-shrink: 0;
  }

  .undo-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dismiss-btn {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-size: var(--text-lg);
    line-height: 1;
    border-radius: 50%;
    transition: color var(--transition-fast);
  }

  .dismiss-btn:hover {
    color: var(--color-text);
  }
</style>
