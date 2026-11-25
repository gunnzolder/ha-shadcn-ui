import type { HassEntities, HassEntity } from "./types";

/**
 * Scenarios = named patches on top of a fixture. They let you see edge cases
 * (outage, inverter offline, faults) without waiting for them to happen at home.
 * Switch in the dev toolbar or with `?scenario=outage`.
 */
export interface Scenario {
  id: string;
  label: string;
  apply(states: HassEntities): void;
}

function patch(states: HassEntities, id: string, state: string, attrs: Record<string, unknown> = {}): void {
  const prev: HassEntity | undefined = states[id];
  if (!prev) return;
  const now = new Date().toISOString();
  states[id] = {
    ...prev,
    state,
    attributes: { ...prev.attributes, ...attrs },
    last_changed: prev.state === state ? prev.last_changed : now,
    last_updated: now,
  };
}

const GRID = "binary_sensor.deye_grid";
const CONN = "binary_sensor.deye_connection";
const PHASES = ["sensor.deye_grid_l1_voltage", "sensor.deye_grid_l2_voltage", "sensor.deye_grid_l3_voltage"];
const OUTAGE = "sensor.lapka_svitla_queue_4_1";

export const scenarios: Scenario[] = [
  { id: "normal", label: "Як зараз (знімок)", apply: () => {} },
  {
    id: "outage",
    label: "Відключення",
    apply: (s) => {
      patch(s, GRID, "off");
      PHASES.forEach((p) => patch(s, p, "0.0"));
      patch(s, "sensor.deye_battery", "64");
      patch(s, OUTAGE, "off", {
        status: "Зараз світла немає",
        next_event: "Увімкнення о 21:30",
      });
    },
  },
  {
    id: "low-battery",
    label: "Відключення, батарея 22%",
    apply: (s) => {
      patch(s, GRID, "off");
      PHASES.forEach((p) => patch(s, p, "0.0"));
      patch(s, "sensor.deye_battery", "22");
      patch(s, OUTAGE, "off", { next_event: "Увімкнення о 21:30" });
    },
  },
  {
    id: "phase-loss",
    label: "Мережа off, але на L2 є напруга",
    apply: (s) => {
      patch(s, GRID, "off");
      patch(s, PHASES[0]!, "0.0");
      patch(s, PHASES[1]!, "221.3");
      patch(s, PHASES[2]!, "0.0");
    },
  },
  {
    id: "fault",
    label: "Аварія інвертора",
    apply: (s) => {
      patch(s, "sensor.deye_device_alarm", "Grid phase failure");
    },
  },
  {
    id: "inverter-offline",
    label: "Інвертор недоступний",
    apply: (s) => {
      patch(s, CONN, "off");
      [GRID, ...PHASES, "sensor.deye_battery", "sensor.deye_device_alarm", "sensor.deye_device_fault"].forEach((id) =>
        patch(s, id, "unavailable"),
      );
    },
  },
  {
    id: "tomorrow-published",
    label: "Графік на завтра опубліковано",
    apply: (s) => {
      patch(s, OUTAGE, "on", {
        tomorrow_heading: "Завтра · без світла 6 год",
        tomorrow_intervals: ["09:00 – 12:00 · 3 год", "18:00 – 21:00 · 3 год"],
      });
    },
  },
  {
    id: "everything-unavailable",
    label: "Усе unavailable",
    apply: (s) => {
      Object.keys(s).forEach((id) => patch(s, id, "unavailable"));
    },
  },
];

export function getScenario(id: string | null | undefined): Scenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0]!;
}
