<script lang="ts">
  import { slide } from 'svelte/transition';
  import { nanoid } from 'nanoid';
  import type { Player } from '../../types';
  import PlayerRow from './PlayerRow.svelte';

  interface Props {
    players: Player[];
    onUpdate: (players: Player[]) => void;
  }

  let { players, onUpdate }: Props = $props();
  let newPlayerId = $state<string | null>(null);
  let addButtonEl = $state<HTMLButtonElement | undefined>(undefined);

  function addPlayer() {
    const id = nanoid();
    newPlayerId = id;
    onUpdate([
      ...players,
      { id, number: null, name: '', shots: { onGoal: 0, blocked: 0, missed: 0 } },
    ]);
  }

  function removePlayer(id: string) {
    onUpdate(players.filter((p) => p.id !== id));
  }

  function updatePlayer(updated: Player) {
    onUpdate(players.map((p) => (p.id === updated.id ? updated : p)));
  }
</script>

<div class="roster-editor">
  <div class="player-list">
    {#each players as player (player.id)}
      <div transition:slide={{ duration: 200 }}>
        <PlayerRow
          {player}
          autofocus={player.id === newPlayerId}
          onRemove={() => removePlayer(player.id)}
          onUpdate={updatePlayer}
        />
      </div>
    {/each}
  </div>

  <button class="add-btn" onclick={addPlayer} bind:this={addButtonEl}>
    <span class="add-icon">＋</span>
    Add Player
  </button>
</div>

<style>
  .roster-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .player-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: var(--touch-target);
    width: 100%;
    background: transparent;
    border: 1px dashed var(--color-border);
    border-radius: var(--border-radius);
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 500;
    transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
    margin-top: var(--space-1);
  }

  .add-btn:hover {
    border-color: var(--accent-home);
    color: var(--accent-home);
    background: var(--accent-home-dim);
  }

  .add-icon {
    font-size: var(--text-base);
  }
</style>
