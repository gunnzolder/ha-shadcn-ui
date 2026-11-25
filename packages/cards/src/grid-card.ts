import { html, nothing } from "lit";
import { DEFAULT_GRID, deriveGrid, relativeTime, type GridEntities, type GridStatus } from "@hsu/ha-data";
import { HsuBaseCard, registerCard } from "./base-card";
import { baseStyles, tokenStyles } from "./styles";
import { css } from "lit";

export interface GridCardConfig {
  type: string;
  title?: string;
  /** Override any of the default deye entity ids. */
  entities?: Partial<GridEntities>;
}

const STATUS: Record<GridStatus, { label: string; tone: string }> = {
  on: { label: "Мережа є", tone: "success" },
  off: { label: "Мережі немає", tone: "destructive" },
  error: { label: "Помилка", tone: "warning" },
  unavailable: { label: "Недоступно", tone: "muted" },
};

const phaseTone = (v: number | null) => (v === null || v < 50 ? "muted" : v < 207 || v > 253 ? "warning" : "success");

export class HsuGridCard extends HsuBaseCard<GridCardConfig> {
  static styles = [
    tokenStyles,
    baseStyles,
    css`
      .phases {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .phase {
        background: color-mix(in oklab, var(--muted) 60%, transparent);
        border-radius: calc(var(--radius) * 1.2);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .phase .label {
        font-size: 12px;
        font-weight: 500;
        color: var(--muted-foreground);
      }
      .phase .value {
        font-size: 20px;
        font-weight: 600;
      }
      .phase .value small {
        font-size: 13px;
        font-weight: 400;
        color: var(--muted-foreground);
        margin-left: 2px;
      }
      .battery {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .battery .meter {
        flex: 1;
      }
      .battery ha-icon {
        --mdc-icon-size: 20px;
      }
      .battery .pct {
        width: 48px;
        text-align: right;
        font-size: 14px;
        font-weight: 500;
      }
    `,
  ];

  private get entities(): GridEntities {
    return { ...DEFAULT_GRID, ...(this._config?.entities ?? {}) };
  }

  protected watchedEntities() {
    const e = this.entities;
    return [e.connection, e.grid, e.alarm, e.fault, ...e.phases, e.battery];
  }

  protected validate(config: GridCardConfig) {
    if (config.entities?.phases && config.entities.phases.length !== 3) {
      throw new Error("entities.phases must have exactly 3 entity ids");
    }
  }

  static getStubConfig(): Partial<GridCardConfig> {
    return {};
  }

  getCardSize() {
    return 4;
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    const v = deriveGrid(this.hass.states, this.entities);
    const s = STATUS[v.status];
    const batteryIcon =
      v.battery.level === "low" ? "mdi:battery-10" : v.battery.level === "unavailable" ? "mdi:battery-unknown" : "mdi:battery-high";
    const batteryTone = v.battery.level === "low" ? "destructive" : v.battery.level === "ok" ? "success" : "muted";
    return html`
      <div class="card">
        <div class="header">
          <div>
            <div class="title"><ha-icon icon="mdi:transmission-tower"></ha-icon>${this._config.title ?? "Мережа"}</div>
            <div class="description">${v.reason ?? (v.since ? `змінилось ${relativeTime(v.since)}` : "")}</div>
          </div>
          <span class="badge" data-status=${v.status}>
            <span class="dot tone-${s.tone} ${v.status === "off" || v.status === "error" ? "pulse" : ""}"></span>${s.label}
          </span>
        </div>
        <div class="phases">
          ${v.phases.map(
            (p) => html`
              <div class="phase">
                <div class="label">${p.label}</div>
                <div class="value num">${p.volts === null ? "—" : Math.round(p.volts)}<small>V</small></div>
                <div class="meter">
                  <div class="tone-${phaseTone(p.volts)}" style="width:${p.volts === null ? 0 : Math.min(100, (p.volts / 250) * 100)}%"></div>
                </div>
              </div>
            `,
          )}
        </div>
        <div class="separator"></div>
        <div class="battery">
          <ha-icon icon=${batteryIcon} style="color: var(--${batteryTone === "muted" ? "muted-foreground" : batteryTone})"></ha-icon>
          <div class="meter"><div class="tone-${batteryTone}" style="width:${v.battery.percent ?? 0}%"></div></div>
          <div class="pct num">${v.battery.percent === null ? "—" : `${v.battery.percent}%`}</div>
        </div>
      </div>
    `;
  }
}

registerCard("hsu-grid-card", HsuGridCard, "shadcn · Мережа", "Стан мережі, напруга по фазах і батарея інвертора");
