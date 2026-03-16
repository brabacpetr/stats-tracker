<script lang="ts">
  interface Props {
    onSave: () => void;
    disabled?: boolean;
  }

  let { onSave, disabled = false }: Props = $props();
</script>

<div class="bottom-bar">
  <button class="save-btn" onclick={onSave} {disabled}>
    <span class="save-icon">💾</span>
    Save to Google Sheets
  </button>
</div>

<style>
  .bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    padding: var(--space-3) var(--space-4);
    padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom));
    background: rgba(10, 14, 23, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--color-border);
  }

  .save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;
    height: var(--touch-target);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: 600;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    display: flex;
  }

  .save-btn:hover:not(:disabled) {
    background: var(--color-surface-raised);
    border-color: var(--accent-home);
    color: var(--accent-home);
  }

  .save-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .save-icon {
    font-size: var(--text-lg);
  }
</style>
