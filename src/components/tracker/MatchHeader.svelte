<script lang="ts">
  interface Props {
    homeTeam: string;
    awayTeam: string;
    homeTotal: number;
    awayTotal: number;
  }

  let { homeTeam, awayTeam, homeTotal, awayTotal }: Props = $props();
</script>

<header class="match-header">
  <div class="team home">
    <span class="team-name">{homeTeam}</span>
    <span class="team-total">{homeTotal}</span>
  </div>
  <div class="divider">vs</div>
  <div class="team away">
    <span class="team-total">{awayTotal}</span>
    <span class="team-name">{awayTeam}</span>
  </div>
</header>

<style>
  .match-header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgba(10, 14, 23, 0.92);
  }

  .team {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .team.away {
    flex-direction: row-reverse;
  }

  .team-name {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .team-total {
    font-family: var(--font-mono);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    min-width: 2ch;
    text-align: center;
  }

  .team.home .team-total {
    color: var(--accent-home);
  }

  .team.away .team-total {
    color: var(--accent-away);
  }

  .divider {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-dim);
    padding: 0 var(--space-3);
  }
</style>
