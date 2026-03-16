<script lang="ts">
  import type { Period, ShotType } from '../../types.js';
  import { matchStore } from '../../lib/state.svelte.js';
  import MatchHeader from '../tracker/MatchHeader.svelte';
  import SubHeader from '../tracker/SubHeader.svelte';
  import PlayerCard from '../tracker/PlayerCard.svelte';
  import AwayTotalsCard from '../tracker/AwayTotalsCard.svelte';
  import BottomBar from '../tracker/BottomBar.svelte';
  import UndoToast from '../shared/UndoToast.svelte';
  import SaveConfirmation from '../shared/SaveConfirmation.svelte';

  interface Props {
    onSave?: () => void;
  }

  let { onSave }: Props = $props();
  let showSaveModal = $state(false);
</script>

{#if matchStore.matchState}
  <div class="tracker-screen">
    <MatchHeader
      homeTeam={matchStore.matchState.homeTeam}
      awayTeam={matchStore.matchState.awayTeam}
      homeTotal={matchStore.homeTotal}
      awayTotal={matchStore.awayTotal}
    />

    <SubHeader
      currentPeriod={matchStore.matchState.currentPeriod}
      canUndo={matchStore.canUndo}
      onUndo={() => matchStore.undoLast()}
      onPeriodChange={(p: Period) => matchStore.changePeriod(p)}
    />

    <main class="scroll-area">
      <div class="content">
        <div class="section-label home-label">Home Players</div>

        <div class="player-grid">
          {#each matchStore.matchState.players as player (player.id)}
            <PlayerCard
              {player}
              onShot={(playerId: string, type: ShotType) => matchStore.recordShot('home', playerId, type)}
              onUpdate={(playerId: string, updates: { name?: string; number?: number | null }) =>
                matchStore.updatePlayer(playerId, updates)}
            />
          {/each}
        </div>

        <div class="section-divider">
          <span class="divider-line"></span>
          <span class="divider-text">Away</span>
          <span class="divider-line"></span>
        </div>

        <AwayTotalsCard
          awayTeam={matchStore.matchState.awayTeam}
          awayShots={matchStore.matchState.awayShots}
          onShot={(type: ShotType) => matchStore.recordShot('away', 'away', type)}
        />

        <div class="bottom-spacer"></div>
      </div>
    </main>

    <BottomBar onSave={() => (showSaveModal = true)} />

    <UndoToast />

    {#if showSaveModal && matchStore.matchState}
      <SaveConfirmation
        matchData={matchStore.matchState}
        homeTotal={matchStore.homeTotal}
        awayTotal={matchStore.awayTotal}
        onSuccess={() => {
          showSaveModal = false;
          onSave?.();
        }}
        onCancel={() => (showSaveModal = false)}
      />
    {/if}
  </div>
{/if}

<style>
  .tracker-screen {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
  }

  .scroll-area {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .content {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .section-label {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-dim);
    padding: var(--space-1) 0;
  }

  .home-label {
    color: var(--accent-home);
    opacity: 0.6;
  }

  .player-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  @media (min-width: 768px) {
    .player-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }

  .section-divider {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: var(--space-2) 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  .divider-text {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-dim);
  }

  .bottom-spacer {
    height: calc(var(--touch-target) + var(--space-6) + env(safe-area-inset-bottom));
  }
</style>
