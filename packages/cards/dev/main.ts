import "./ha-shim";
import "../src/index";
import { resolveDevSource, scenarios, type MockSource } from "@hsu/ha-data";

declare const __HSU_SOURCE__: string;
declare const __HA_URL__: string;
declare const __HA_TOKEN__: string;

const source = resolveDevSource({ mode: __HSU_SOURCE__, haUrl: __HA_URL__, haToken: __HA_TOKEN__ });
const mock = source.kind === "mock" ? (source as MockSource) : undefined;

// Same YAML you would put on a dashboard.
const cards: Record<string, unknown>[] = [
  { type: "custom:hsu-grid-card" },
  { type: "custom:hsu-outage-card", entity: "sensor.lapka_svitla_queue_4_1" },
];

type LovelaceCard = HTMLElement & { setConfig(c: unknown): void; hass?: unknown };
const els: LovelaceCard[] = [];
const grid = document.getElementById("grid")!;
for (const cfg of cards) {
  const tag = String(cfg.type).replace(/^custom:/, "");
  const el = document.createElement(tag) as LovelaceCard;
  el.setConfig(cfg);
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div class="label">${cfg.type}</div>`;
  wrap.appendChild(el);
  grid.appendChild(wrap);
  els.push(el);
}

const push = () => {
  const hass = source.getHass();
  if (!hass) return;
  document.body.classList.toggle("dark", !!hass.themes?.darkMode);
  for (const el of els) el.hass = hass;
};
source.subscribe(push);
push();

// toolbar
document.getElementById("source")!.textContent = source.kind === "live" ? "LIVE HA" : "mock";
const sel = document.getElementById("scenario") as HTMLSelectElement;
sel.disabled = !mock;
for (const s of scenarios) sel.add(new Option(s.label, s.id, false, s.id === mock?.getScenarioId()));
sel.onchange = () => mock?.setScenario(sel.value);
const dark = document.getElementById("dark") as HTMLInputElement;
dark.checked = !!source.getHass()?.themes?.darkMode;
dark.onchange = () => mock?.setDarkMode(dark.checked);
