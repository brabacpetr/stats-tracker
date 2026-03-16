<script lang="ts">
  import { onMount } from 'svelte';
  import { initGoogleAuth, triggerAuthPopup, isSignedIn } from '../../lib/auth.js';
  import { appendMatchData } from '../../lib/sheets.js';
  import { exportAsJson } from '../../lib/transform.js';
  import type { MatchState } from '../../types.js';

  interface Props {
    matchData: MatchState;
    homeTotal: number;
    awayTotal: number;
    onSuccess: () => void;
    onCancel: () => void;
  }

  let { matchData, homeTotal, awayTotal, onSuccess, onCancel }: Props = $props();

  type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
  let saveStatus = $state<SaveStatus>('idle');
  let errorMessage = $state('');
  let authReady = $state(false);

  // Pre-load GIS/GAPI scripts so requestAccessToken() can be called synchronously
  // from the click handler (required for iOS Safari popup policy).
  onMount(async () => {
    await initGoogleAuth();
    authReady = true;
  });

  // Called directly from the click handler — no awaits before triggerAuthPopup()
  // so iOS Safari allows the OAuth popup to open.
  function handleSave() {
    if (isSignedIn()) {
      doSave();
      return;
    }
    saveStatus = 'saving';
    triggerAuthPopup(
      () => doSave(),
      (err) => {
        saveStatus = 'error';
        errorMessage = err.message;
      }
    );
  }

  async function doSave() {
    saveStatus = 'saving';
    errorMessage = '';
    try {
      await appendMatchData(matchData);
      saveStatus = 'success';
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      saveStatus = 'error';
      errorMessage = err instanceof Error ? err.message : 'Unknown error occurred.';
    }
  }

  function handleDownloadJson() {
    exportAsJson(matchData);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<div
  class="overlay"
  role="presentation"
  onclick={(e) => e.target === e.currentTarget && saveStatus === 'idle' && onCancel()}
>
  <div class="modal" role="dialog" aria-modal="true" aria-label="Save match">

    {#if saveStatus ==='success'}
      <div class="success-state">
        <div class="success-icon">✓</div>
        <p class="success-text">Saved to Google Sheets</p>
      </div>

    {:else}
      <div class="modal-header">
        <h2 class="modal-title">Save Match</h2>
        {#if saveStatus ==='idle'}
          <button class="close-btn" onclick={onCancel} aria-label="Cancel">✕</button>
        {/if}
      </div>

      <div class="match-summary">
        <div class="team-row home">
          <span class="team-name">{matchData.homeTeam}</span>
          <span class="team-total">{homeTotal}</span>
        </div>
        <div class="vs-label">vs</div>
        <div class="team-row away">
          <span class="team-name">{matchData.awayTeam}</span>
          <span class="team-total">{awayTotal}</span>
        </div>
        <div class="meta">
          {matchData.date} · {matchData.players.length} player{matchData.players.length !== 1 ? 's' : ''}
        </div>
      </div>

      {#if saveStatus ==='error'}
        <div class="error-box" role="alert">
          <span class="error-icon">⚠</span>
          <span class="error-text">{errorMessage}</span>
        </div>
      {/if}

      <div class="actions">
        <button
          class="btn-primary"
          onclick={handleSave}
          disabled={!authReady || saveStatus === 'saving'}
          aria-busy={saveStatus === 'saving'}
        >
          {#if saveStatus === 'saving'}
            <span class="spinner" aria-hidden="true"></span>
            Saving…
          {:else if saveStatus === 'error'}
            Retry
          {:else}
            Save to Google Sheets
          {/if}
        </button>

        <button class="btn-secondary" onclick={handleDownloadJson} disabled={saveStatus === 'saving'}>
          Download JSON
        </button>

        {#if saveStatus !== 'saving'}
          <button class="btn-ghost" onclick={onCancel}>Cancel</button>
        {/if}
      </div>
    {/if}

  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(10, 14, 23, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: var(--space-4);
    padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
  }

  @media (min-width: 480px) {
    .overlay {
      align-items: center;
    }
  }

  .modal {
    width: 100%;
    max-width: var(--max-width);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  /* Header */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--border-radius);
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-fast);
  }

  .close-btn:hover {
    background: var(--color-surface-raised);
    color: var(--color-text);
  }

  /* Match summary */
  .match-summary {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .team-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .team-name {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
  }

  .team-total {
    font-family: var(--font-mono);
    font-size: var(--text-2xl);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .home .team-total { color: var(--accent-home); }
  .away .team-total { color: var(--accent-away); }

  .vs-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .meta {
    font-size: var(--text-xs);
    color: var(--color-text-dim);
    text-align: center;
    margin-top: var(--space-1);
  }

  /* Error */
  .error-box {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    background: var(--danger-dim);
    border: 1px solid var(--danger);
    border-radius: var(--border-radius);
    padding: var(--space-3);
  }

  .error-icon {
    color: var(--danger);
    font-size: var(--text-base);
    flex-shrink: 0;
  }

  .error-text {
    font-size: var(--text-sm);
    color: var(--color-text);
    line-height: 1.4;
  }

  /* Actions */
  .actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .btn-primary {
    height: var(--touch-target);
    background: var(--accent-home);
    border: none;
    border-radius: var(--border-radius);
    color: #0A0E17;
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    transition: opacity var(--transition-fast);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary:not(:disabled):active {
    opacity: 0.85;
  }

  .btn-secondary {
    height: var(--touch-target);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 500;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-raised);
    color: var(--color-text);
  }

  .btn-secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-ghost {
    height: var(--touch-target);
    background: transparent;
    border: none;
    color: var(--color-text-dim);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    transition: color var(--transition-fast);
  }

  .btn-ghost:hover {
    color: var(--color-text-muted);
  }

  /* Spinner */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(10, 14, 23, 0.3);
    border-top-color: #0A0E17;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Success state */
  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-6) 0;
  }

  .success-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-home);
    color: #0A0E17;
    font-size: var(--text-2xl);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .success-text {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--accent-home);
    margin: 0;
  }
</style>
