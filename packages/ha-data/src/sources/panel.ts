import { Emitter } from "../emitter";
import type { ConnectionStatus, HassLike, HassSource } from "../types";

export interface PanelSource extends HassSource {
  readonly kind: "panel";
  /** Called by the custom element every time HA sets `hass`. */
  push(hass: HassLike): void;
}

/** Production source: HA itself sets `hass` on our custom element (panel or card). */
export function createPanelSource(): PanelSource {
  const emitter = new Emitter();
  let hass: HassLike | undefined;
  return {
    kind: "panel",
    getHass: () => hass,
    getStatus: (): ConnectionStatus => (hass ? "connected" : "connecting"),
    subscribe: emitter.subscribe,
    push(next) {
      if (next === hass) return;
      hass = next;
      emitter.emit();
    },
  };
}
