/**
 * Minimal subset of Home Assistant's frontend `hass` object.
 * Both the real `hass` (panel / Lovelace) and our mock/live sources satisfy it,
 * so UI code never knows where data comes from.
 */
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export type HassEntities = Record<string, HassEntity>;

export interface ServiceTarget {
  entity_id?: string | string[];
  device_id?: string | string[];
  area_id?: string | string[];
}

export interface HassLike {
  states: HassEntities;
  language: string;
  themes?: { darkMode?: boolean };
  user?: { name?: string; is_admin?: boolean };
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: ServiceTarget,
  ): Promise<unknown>;
  /** Optional HA WebSocket command bridge (present in real HA panel and live source). */
  callWS?<T = unknown>(msg: Record<string, unknown>): Promise<T>;
}

export type SourceKind = "mock" | "live" | "panel";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/** Anything that can feed `hass` snapshots to the UI. */
export interface HassSource {
  readonly kind: SourceKind;
  getHass(): HassLike | undefined;
  getStatus(): ConnectionStatus;
  subscribe(listener: () => void): () => void;
  dispose?(): void;
}

export interface Fixture {
  _meta?: Record<string, unknown>;
  view?: unknown;
  states: HassEntities;
}
