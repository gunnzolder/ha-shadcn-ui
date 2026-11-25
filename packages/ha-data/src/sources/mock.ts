import { Emitter } from "../emitter";
import { getScenario } from "../scenarios";
import type { ConnectionStatus, Fixture, HassEntities, HassLike, HassSource, ServiceTarget } from "../types";

export interface MockSourceOptions {
  fixture: Fixture;
  scenario?: string;
  /** Simulate sensor noise every N ms (0 = off). Default 3000. */
  tickMs?: number;
  darkMode?: boolean;
  language?: string;
  /** Called on every service call — handy for asserting in tests or logging in dev. */
  onServiceCall?: (call: { domain: string; service: string; data?: Record<string, unknown>; target?: ServiceTarget }) => void;
}

export interface MockSource extends HassSource {
  readonly kind: "mock";
  setScenario(id: string): void;
  getScenarioId(): string;
  setDarkMode(dark: boolean): void;
  /** Directly set a state (for tests / devtools). */
  setState(entityId: string, state: string, attributes?: Record<string, unknown>): void;
}

const TOGGLE_DOMAINS = new Set(["switch", "light", "input_boolean", "fan", "media_player"]);

function clone<T>(v: T): T {
  return structuredClone(v);
}

export function createMockSource(opts: MockSourceOptions): MockSource {
  const emitter = new Emitter();
  let scenarioId = getScenario(opts.scenario).id;
  let darkMode = opts.darkMode ?? false;
  let states: HassEntities = {};
  let hass: HassLike;

  const rebuild = () => {
    // New object identity on every change — same contract as the real `hass`.
    hass = {
      states,
      language: opts.language ?? "uk",
      themes: { darkMode },
      user: { name: "Mock user", is_admin: true },
      callService,
    };
    emitter.emit();
  };

  const setState = (entityId: string, state: string, attributes: Record<string, unknown> = {}) => {
    const prev = states[entityId];
    const now = new Date().toISOString();
    states = {
      ...states,
      [entityId]: {
        entity_id: entityId,
        state,
        attributes: { ...(prev?.attributes ?? {}), ...attributes },
        last_changed: prev && prev.state === state ? prev.last_changed : now,
        last_updated: now,
      },
    };
    rebuild();
  };

  async function callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: ServiceTarget,
  ): Promise<unknown> {
    opts.onServiceCall?.({ domain, service, data, target });
    const raw = target?.entity_id ?? (data?.entity_id as string | string[] | undefined);
    const ids = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
    await new Promise((r) => setTimeout(r, 120)); // feel a bit like a network round trip
    for (const id of ids) {
      const cur = states[id];
      if (!cur || cur.state === "unavailable") continue;
      const d = id.split(".")[0]!;
      if (!TOGGLE_DOMAINS.has(d) && domain !== "homeassistant") continue;
      if (service === "turn_on") setState(id, "on");
      else if (service === "turn_off") setState(id, "off");
      else if (service === "toggle") setState(id, cur.state === "on" ? "off" : "on");
    }
    return { context: { id: "mock" } };
  }

  const load = () => {
    states = clone(opts.fixture.states);
    getScenario(scenarioId).apply(states);
    rebuild();
  };

  load();

  // Sensor noise so the UI feels alive and re-render paths get exercised.
  let timer: ReturnType<typeof setInterval> | undefined;
  const tickMs = opts.tickMs ?? 3000;
  if (tickMs > 0) {
    timer = setInterval(() => {
      for (const id of Object.keys(states)) {
        const e = states[id]!;
        if (e.attributes.device_class !== "voltage") continue;
        const v = Number.parseFloat(e.state);
        if (!Number.isFinite(v) || v < 50) continue;
        const next = Math.min(245, Math.max(195, v + (Math.random() - 0.5) * 1.6));
        setState(id, next.toFixed(1));
      }
    }, tickMs);
  }

  return {
    kind: "mock",
    getHass: () => hass,
    getStatus: (): ConnectionStatus => "connected",
    subscribe: emitter.subscribe,
    setScenario(id) {
      scenarioId = getScenario(id).id;
      load();
    },
    getScenarioId: () => scenarioId,
    setDarkMode(dark) {
      darkMode = dark;
      rebuild();
    },
    setState,
    dispose() {
      if (timer) clearInterval(timer);
    },
  };
}
