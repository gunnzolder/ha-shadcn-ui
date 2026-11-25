/**
 * Pure view-model functions shared by the React panel and the Lit cards.
 * They are TypeScript ports of the Jinja templates in the current default_view markdown cards,
 * so behaviour stays identical while the UI changes. Covered by domain.test.ts.
 */
import type { HassEntities, HassEntity } from "./types";

export const MISSING = new Set(["unknown", "unavailable"]);
export const isMissing = (e: HassEntity | undefined) => !e || MISSING.has(e.state);
const num = (s: string | undefined) => {
  const v = Number.parseFloat(s ?? "");
  return Number.isFinite(v) ? v : 0;
};

// ---------- Grid / inverter ("Мережа") ----------

export interface GridEntities {
  connection: string;
  grid: string;
  alarm: string;
  fault: string;
  phases: [string, string, string];
  battery: string;
}

export const DEFAULT_GRID: GridEntities = {
  connection: "binary_sensor.deye_connection",
  grid: "binary_sensor.deye_grid",
  alarm: "sensor.deye_device_alarm",
  fault: "sensor.deye_device_fault",
  phases: ["sensor.deye_grid_l1_voltage", "sensor.deye_grid_l2_voltage", "sensor.deye_grid_l3_voltage"],
  battery: "sensor.deye_battery",
};

export type GridStatus = "on" | "off" | "error" | "unavailable";
export type BatteryLevel = "ok" | "low" | "unavailable";

export interface GridView {
  status: GridStatus;
  /** Human reason for error/unavailable states. */
  reason?: string;
  phases: { label: string; volts: number | null }[];
  battery: { level: BatteryLevel; percent: number | null };
  since?: string;
}

export function deriveGrid(states: HassEntities, cfg: GridEntities = DEFAULT_GRID): GridView {
  const get = (id: string) => states[id];
  const connection = get(cfg.connection);
  const grid = get(cfg.grid);
  const alarm = get(cfg.alarm);
  const fault = get(cfg.fault);
  const phaseEnts = cfg.phases.map(get);
  const battery = get(cfg.battery);

  const phases = phaseEnts.map((e, i) => ({
    label: `L${i + 1}`,
    volts: isMissing(e) ? null : num(e!.state),
  }));

  let status: GridStatus;
  let reason: string | undefined;
  if (connection?.state !== "on" || [grid, alarm, fault, ...phaseEnts].some(isMissing)) {
    status = "unavailable";
    reason = connection?.state !== "on" ? "Немає зв'язку з інвертором" : "Частина датчиків недоступна";
  } else if (alarm!.state !== "OK" || fault!.state !== "OK") {
    status = "error";
    reason = alarm!.state !== "OK" ? alarm!.state : fault!.state;
  } else if (grid!.state === "on") {
    status = "on";
  } else if (phaseEnts.some((e) => num(e!.state) > 50)) {
    status = "error";
    reason = "Мережа off, але на фазі є напруга";
  } else {
    status = "off";
  }

  const batteryLevel: BatteryLevel = isMissing(battery) ? "unavailable" : num(battery!.state) <= 30 ? "low" : "ok";

  return {
    status,
    reason,
    phases,
    battery: { level: batteryLevel, percent: isMissing(battery) ? null : num(battery!.state) },
    since: grid?.last_changed,
  };
}

// ---------- Outage schedule ("За графіком") ----------

export const DEFAULT_OUTAGE_ENTITY = "sensor.lapka_svitla_queue_4_1";

export type OutageStatus = "power" | "outage" | "unavailable" | "error";

export interface OutageDay {
  heading: string;
  intervals: string[];
}

export interface OutageView {
  status: OutageStatus;
  nextEvent: string;
  region?: string;
  queue?: string;
  today?: OutageDay;
  tomorrow?: OutageDay;
  synchronized?: string;
}

const str = (v: unknown) => (typeof v === "string" && v.length ? v : undefined);
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function deriveOutage(states: HassEntities, entityId = DEFAULT_OUTAGE_ENTITY): OutageView {
  const e = states[entityId];
  const status: OutageStatus = !e
    ? "unavailable"
    : e.state === "on"
      ? "power"
      : e.state === "off"
        ? "outage"
        : e.state === "unavailable"
          ? "unavailable"
          : "error";
  const a = e?.attributes ?? {};
  const todayHeading = str(a.today_heading);
  const tomorrowHeading = str(a.tomorrow_heading);
  return {
    status,
    nextEvent: str(a.next_event) ?? "",
    region: str(a.region),
    queue: str(a.queue),
    today: todayHeading ? { heading: todayHeading, intervals: list(a.today_intervals) } : undefined,
    tomorrow: tomorrowHeading ? { heading: tomorrowHeading, intervals: list(a.tomorrow_intervals) } : undefined,
    synchronized: str(a.synchronized),
  };
}

// ---------- helpers ----------

export function friendlyName(e: HassEntity | undefined, fallback?: string): string {
  return fallback ?? (e?.attributes.friendly_name as string | undefined) ?? e?.entity_id ?? "—";
}

export function relativeTime(iso: string | undefined, now = Date.now(), locale = "uk"): string {
  if (!iso) return "";
  const diff = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}
