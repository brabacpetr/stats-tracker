<script lang="ts">
  import type { ShotType } from '../../types';

  interface Props {
    type: ShotType;
    count: number;
    onclick: () => void;
    size?: 'normal' | 'large';
  }

  const ICONS: Record<ShotType, string> = {
    onGoal: '🥅',
    blocked: '🛡',
    missed: '✕',
  };

  const LABELS: Record<ShotType, string> = {
    onGoal: 'On Goal',
    blocked: 'Blocked',
    missed: 'Missed',
  };

  let { type, count, onclick, size = 'normal' }: Props = $props();
  let pulse = $state(false);
  // -1 sentinel: skip pulse on initial render
  let prevCount = $state(-1);

  $effect(() => {
    if (prevCount === -1) {
      prevCount = count;
      return;
    }
    if (count !== prevCount) {
      pulse = true;
      prevCount = count;
      setTimeout(() => (pulse = false), 220);
    }
  });
</script>

<button class="shot-btn shot-btn--{type} shot-btn--{size}" class:pulse {onclick}>
  <span class="shot-icon">{ICONS[type]}</span>
  <span class="shot-count" class:pulse>{count}</span>
  <span class="shot-label">{LABELS[type]}</span>
</button>

<style>
  .shot-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: var(--shot-button-height);
    flex: 1;
    border-radius: var(--border-radius);
    transition: transform 50ms ease, opacity var(--transition-fast);
    position: relative;
    overflow: hidden;
  }

  .shot-btn:active {
    transform: scale(0.95);
  }

  .shot-btn--onGoal {
    background: var(--shot-on-goal-dim);
    color: var(--shot-on-goal);
  }

  .shot-btn--blocked {
    background: var(--shot-blocked-dim);
    color: var(--shot-blocked);
  }

  .shot-btn--missed {
    background: var(--shot-missed-dim);
    color: var(--shot-missed);
  }

  .shot-btn--large {
    height: 72px;
  }

  .shot-icon {
    font-size: var(--text-base);
    line-height: 1;
  }

  .shot-count {
    font-family: var(--font-mono);
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .shot-count.pulse {
    transform: scale(1.3);
  }

  .shot-label {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
  }
</style>
