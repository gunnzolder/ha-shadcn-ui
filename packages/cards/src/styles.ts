import { css, unsafeCSS } from "lit";
import tokens from "@hsu/tokens/theme.css?inline";

/**
 * shadcn look inside Lovelace's shadow DOM.
 * Tailwind classes don't cross shadow roots, so cards use plain CSS on top of the SAME
 * CSS variables the panel uses (packages/tokens). Change tokens.json → both update.
 */
export const tokenStyles = unsafeCSS(tokens);

export const baseStyles = css`
  :host {
    display: block;
    color: var(--foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  .card {
    background: var(--card);
    color: var(--card-foreground);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) * 1.6);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    box-sizing: border-box;
  }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title ha-icon {
    --mdc-icon-size: 18px;
    color: var(--muted-foreground);
  }
  .description {
    font-size: 13px;
    color: var(--muted-foreground);
    margin-top: 2px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 500;
  }
  .chip {
    display: inline-flex;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 12px;
    background: var(--secondary);
    color: var(--secondary-foreground);
    font-variant-numeric: tabular-nums;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--muted-foreground);
  }
  .tone-success { background: var(--success); }
  .tone-destructive { background: var(--destructive); }
  .tone-warning { background: var(--warning); }
  .tone-muted { background: color-mix(in oklab, var(--muted-foreground) 40%, transparent); }
  .pulse { animation: pulse 1.6s ease-in-out infinite; }
  @keyframes pulse {
    50% { opacity: 0.35; }
  }
  .separator {
    height: 1px;
    background: var(--border);
  }
  .meter {
    height: 6px;
    border-radius: 999px;
    background: var(--muted);
    overflow: hidden;
  }
  .meter > div {
    height: 100%;
    border-radius: inherit;
    transition: width 0.4s ease;
  }
  .muted { color: var(--muted-foreground); }
  .num { font-variant-numeric: tabular-nums; }
`;
