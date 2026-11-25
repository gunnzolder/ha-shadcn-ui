import { LitElement, type PropertyValues } from "lit";
import type { HassLike } from "@hsu/ha-data";

/**
 * Common Lovelace card plumbing: hass/config properties, dark mode from HA, sizing hints.
 * Lovelace calls setConfig() once, then sets `hass` on every state change.
 */
export abstract class HsuBaseCard<C extends object> extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  declare hass?: HassLike;
  declare _config?: C;

  /** Entity ids this card depends on — only re-render when one of them changes. */
  protected abstract watchedEntities(): string[];
  protected abstract validate(config: C): void;

  setConfig(config: C): void {
    this.validate(config);
    this._config = config;
  }

  protected shouldUpdate(changed: PropertyValues<this>): boolean {
    if (changed.has("_config") || !changed.has("hass")) return true;
    const prev = changed.get("hass") as HassLike | undefined;
    if (!prev || !this.hass) return true;
    if (prev.themes?.darkMode !== this.hass.themes?.darkMode) return true;
    return this.watchedEntities().some((id) => prev.states[id] !== this.hass!.states[id]);
  }

  protected willUpdate(): void {
    this.toggleAttribute("dark", this.hass?.themes?.darkMode ?? false);
  }

  /** Sections view (HA 2024.3+) sizing. */
  getGridOptions() {
    return { columns: 6, min_columns: 6, rows: "auto" as const };
  }
}

declare global {
  interface Window {
    customCards?: { type: string; name: string; description?: string; preview?: boolean; documentationURL?: string }[];
  }
}

export function registerCard(tag: string, ctor: CustomElementConstructor, name: string, description: string) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
  window.customCards = window.customCards ?? [];
  if (!window.customCards.some((c) => c.type === tag)) {
    window.customCards.push({ type: tag, name, description, preview: true });
  }
}
