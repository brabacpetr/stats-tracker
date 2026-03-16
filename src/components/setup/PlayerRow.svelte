<script lang="ts">
  import { onMount } from 'svelte';
  import type { Player } from '../../types';

  interface Props {
    player: Player;
    onRemove: () => void;
    onUpdate: (p: Player) => void;
    autofocus?: boolean;
  }

  let { player, onRemove, onUpdate, autofocus = false }: Props = $props();
  let nameInputEl = $state<HTMLInputElement | undefined>(undefined);

  onMount(() => {
    if (autofocus && nameInputEl) {
      nameInputEl.focus();
    }
  });

  function handleNumberChange(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    const num = val === '' ? null : parseInt(val, 10);
    onUpdate({ ...player, number: isNaN(num as number) ? null : num });
  }

  function handleNameChange(e: Event) {
    onUpdate({ ...player, name: (e.target as HTMLInputElement).value });
  }
</script>

<div class="player-row">
  <input
    class="number-input"
    type="text"
    inputmode="numeric"
    pattern="[0-9]*"
    maxlength="2"
    placeholder="#"
    value={player.number ?? ''}
    oninput={handleNumberChange}
    aria-label="Jersey number"
  />
  <input
    class="name-input"
    type="text"
    placeholder="Player name"
    value={player.name}
    oninput={handleNameChange}
    bind:this={nameInputEl}
    aria-label="Player name"
  />
  <button class="remove-btn" onclick={onRemove} aria-label="Remove player">✕</button>
</div>

<style>
  .player-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface);
    border-radius: var(--border-radius);
    border-left: 2px solid var(--accent-home);
  }

  .number-input {
    width: 56px;
    height: var(--touch-target);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 700;
    text-align: center;
    padding: 0 var(--space-2);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .number-input:focus {
    border-color: var(--accent-home);
  }

  .name-input {
    flex: 1;
    height: var(--touch-target);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    padding: 0 var(--space-3);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .name-input:focus {
    border-color: var(--accent-home);
  }

  .name-input::placeholder,
  .number-input::placeholder {
    color: var(--color-text-dim);
  }

  .remove-btn {
    width: var(--touch-target);
    height: var(--touch-target);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--danger);
    font-size: var(--text-lg);
    border-radius: var(--border-radius);
    transition: background var(--transition-fast);
    flex-shrink: 0;
  }

  .remove-btn:hover {
    background: var(--danger-dim);
  }
</style>
