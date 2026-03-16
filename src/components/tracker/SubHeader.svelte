<script lang="ts">
  import type { Period } from '../../types';

  interface Props {
    currentPeriod: Period;
    canUndo: boolean;
    onUndo: () => void;
    onPeriodChange: (p: Period) => void;
  }

  let { currentPeriod, canUndo, onUndo, onPeriodChange }: Props = $props();

  const periods: Period[] = [1, 2, 3];
</script>

<div class="sub-header">
  <button
    class="undo-btn"
    class:undo-btn--active={canUndo}
    onclick={onUndo}
    disabled={!canUndo}
    aria-label="Undo last shot"
  >
    <span class="undo-icon">⟲</span>
    <span class="undo-label">Undo</span>
  </button>

  <div class="period-selector" role="group" aria-label="Select period">
    {#each periods as p}
      <button
        class="period-pill"
        class:period-pill--active={currentPeriod === p}
        onclick={() => onPeriodChange(p)}
        aria-pressed={currentPeriod === p}
        aria-label="Period {p}"
      >
        {p}
      </button>
    {/each}
  </div>
</div>

<style>
  .sub-header {
    position: sticky;
    top: 57px; /* match-header height */
    z-index: 9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
    background: rgba(10, 14, 23, 0.9);
    border-bottom: 1px solid var(--color-border);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .undo-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    height: 36px;
    padding: 0 var(--space-3);
    border-radius: var(--border-radius);
    color: var(--color-text-dim);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 500;
    transition: color var(--transition-fast), background var(--transition-fast);
  }

  .undo-btn--active {
    color: var(--danger);
  }

  .undo-btn--active:hover {
    background: var(--danger-dim);
  }

  .undo-icon {
    font-size: var(--text-lg);
    line-height: 1;
  }

  .undo-label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .period-selector {
    display: flex;
    gap: var(--space-1);
  }

  .period-pill {
    width: 40px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-muted);
    background: transparent;
    border: 1px solid var(--color-border);
    transition: color var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
  }

  .period-pill--active {
    color: var(--accent-home);
    background: var(--accent-home-dim);
    border-color: var(--accent-home);
  }
</style>
