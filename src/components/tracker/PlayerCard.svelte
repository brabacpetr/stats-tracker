<script lang="ts">
  import type { Player, ShotType } from '../../types.js';
  import ShotButton from './ShotButton.svelte';

  interface Props {
    player: Player;
    onShot: (playerId: string, type: ShotType) => void;
    onUpdate: (playerId: string, updates: { name?: string; number?: number | null }) => void;
  }

  let { player, onShot, onUpdate }: Props = $props();

  const total = $derived(player.shots.onGoal + player.shots.blocked + player.shots.missed);

  // Quick-edit state
  let editing = $state(false);
  let editName = $state('');
  let editNumber = $state<string>('');
  let longPressTimer: ReturnType<typeof setTimeout>;
  let startX = 0;
  let startY = 0;
  let nameInput = $state<HTMLInputElement | undefined>(undefined);

  function startLongPress(e: PointerEvent) {
    startX = e.clientX;
    startY = e.clientY;
    longPressTimer = setTimeout(() => {
      editName = player.name;
      editNumber = player.number != null ? String(player.number) : '';
      editing = true;
      // Focus name input after DOM updates
      setTimeout(() => nameInput?.focus(), 50);
    }, 500);
  }

  function cancelLongPress() {
    clearTimeout(longPressTimer);
  }

  function onPointerMove(e: PointerEvent) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.sqrt(dx * dx + dy * dy) > 10) cancelLongPress();
  }

  function confirmEdit() {
    const num = editNumber.trim() === '' ? null : parseInt(editNumber, 10);
    onUpdate(player.id, {
      name: editName.trim() || player.name,
      number: isNaN(num!) ? null : num,
    });
    editing = false;
  }

  function onEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') confirmEdit();
    if (e.key === 'Escape') editing = false;
  }
</script>

<div class="player-card">
  {#if editing}
    <div class="player-edit">
      <input
        class="edit-number-input"
        type="text"
        inputmode="numeric"
        placeholder="#"
        bind:value={editNumber}
        bind:this={nameInput}
        onkeydown={onEditKeydown}
        maxlength="3"
      />
      <input
        class="edit-name-input"
        type="text"
        placeholder="Player name"
        bind:value={editName}
        onkeydown={onEditKeydown}
      />
      <button class="done-btn" onclick={confirmEdit}>Done</button>
    </div>
  {:else}
    <div
      class="player-info"
      role="group"
      aria-label="Long-press to edit player {player.name}"
      onpointerdown={startLongPress}
      onpointerup={cancelLongPress}
      onpointercancel={cancelLongPress}
      onpointermove={onPointerMove}
    >
      <span class="player-number">
        {player.number != null ? `#${player.number}` : '—'}
      </span>
      <span class="player-name">{player.name || 'Unnamed'}</span>
      <span class="player-total">Σ {total}</span>
    </div>
  {/if}
  <div class="shot-buttons">
    <ShotButton type="onGoal" count={player.shots.onGoal} onclick={() => onShot(player.id, 'onGoal')} />
    <ShotButton type="blocked" count={player.shots.blocked} onclick={() => onShot(player.id, 'blocked')} />
    <ShotButton type="missed" count={player.shots.missed} onclick={() => onShot(player.id, 'missed')} />
  </div>
</div>

<style>
  .player-card {
    background: var(--color-surface);
    border-radius: var(--border-radius);
    border-left: 2px solid var(--accent-home);
    overflow: hidden;
  }

  .player-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-3) var(--space-2);
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
  }

  .player-number {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--accent-home);
    min-width: 36px;
  }

  .player-name {
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

  .player-total {
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-text-muted);
  }

  /* Edit mode */
  .player-edit {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
  }

  .edit-number-input {
    width: 52px;
    height: 36px;
    background: var(--color-bg);
    border: 1px solid var(--accent-home);
    border-radius: var(--border-radius-sm);
    color: var(--accent-home);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
    text-align: center;
    outline: none;
  }

  .edit-name-input {
    flex: 1;
    height: 36px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 600;
    padding: 0 var(--space-2);
    outline: none;
  }

  .edit-name-input:focus {
    border-color: var(--accent-home);
  }

  .done-btn {
    height: 36px;
    padding: 0 var(--space-3);
    background: var(--accent-home);
    color: #0a0e17;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: var(--border-radius-sm);
    white-space: nowrap;
  }

  .shot-buttons {
    display: flex;
    gap: var(--space-1);
    padding: 0 var(--space-2) var(--space-2);
  }
</style>
