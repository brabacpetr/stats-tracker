<script lang="ts">
  import { matchStore } from './lib/state.svelte.js';
  import type { MatchState } from './types.js';
  import Setup from './components/screens/Setup.svelte';
  import Tracker from './components/screens/Tracker.svelte';
  import Summary from './components/screens/Summary.svelte';

  let screen = $state<'setup' | 'tracker' | 'summary'>('setup');

  function handleStart(state: MatchState) {
    matchStore.initMatch(state);
    screen = 'tracker';
  }

  function handleSave() {
    screen = 'summary';
  }

  function handleNewMatch() {
    screen = 'setup';
  }
</script>

{#if screen === 'setup'}
  <Setup onStart={handleStart} />
{:else if screen === 'tracker'}
  <Tracker onSave={handleSave} />
{:else}
  <Summary onNewMatch={handleNewMatch} />
{/if}
