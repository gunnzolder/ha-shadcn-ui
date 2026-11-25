import { css, html, nothing } from "lit";
import { DEFAULT_OUTAGE_ENTITY, deriveOutage, type OutageDay, type OutageStatus } from "@hsu/ha-data";
import { HsuBaseCard, registerCard } from "./base-card";
import { baseStyles, tokenStyles } from "./styles";

export interface OutageCardConfig {
  type: string;
  entity?: string;
  title?: string;
}

const STATUS: Record<OutageStatus, { label: string; tone: string }> = {
  power: { label: "Світло є", tone: "success" },
  outage: { label: "Відключення", tone: "destructive" },
  unavailable: { label: "Недоступно", tone: "muted" },
  error: { label: "Помилка", tone: "warning" },
};

export class HsuOutageCard extends HsuBaseCard<OutageCardConfig> {
  static styles = [
    tokenStyles,
    baseStyles,
    css`
      .next {
        font-size: 20px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .day {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .day-heading {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
      }
      .day-heading ha-icon {
        --mdc-icon-size: 16px;
        color: var(--muted-foreground);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .sync {
        font-size: 12px;
      }
    `,
  ];

  private get entityId() {
    return this._config?.entity ?? DEFAULT_OUTAGE_ENTITY;
  }

  protected watchedEntities() {
    return [this.entityId];
  }

  protected validate(config: OutageCardConfig) {
    if (config.entity && !config.entity.startsWith("sensor.")) throw new Error("entity must be a sensor");
  }

  static getStubConfig(): Partial<OutageCardConfig> {
    return { entity: DEFAULT_OUTAGE_ENTITY };
  }

  getCardSize() {
    return 4;
  }

  private day(d: OutageDay, icon: string) {
    return html`
      <div class="day">
        <div class="day-heading"><ha-icon icon=${icon}></ha-icon>${d.heading}</div>
        ${d.intervals.length
          ? html`<div class="chips">${d.intervals.map((i) => html`<span class="chip">${i}</span>`)}</div>`
          : nothing}
      </div>
    `;
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    const v = deriveOutage(this.hass.states, this.entityId);
    const s = STATUS[v.status];
    return html`
      <div class="card">
        <div class="header">
          <div>
            <div class="title"><ha-icon icon="mdi:calendar-clock"></ha-icon>${this._config.title ?? "За графіком"}</div>
            <div class="description">${[v.region, v.queue && `Черга ${v.queue}`].filter(Boolean).join(" · ")}</div>
          </div>
          <span class="badge" data-status=${v.status}>
            <span class="dot tone-${s.tone} ${v.status === "outage" ? "pulse" : ""}"></span>${s.label}
          </span>
        </div>
        ${v.nextEvent ? html`<div class="next">${v.nextEvent}</div>` : nothing}
        <div class="separator"></div>
        ${v.today ? this.day(v.today, "mdi:calendar-today") : nothing}
        ${v.tomorrow ? this.day(v.tomorrow, "mdi:calendar-arrow-right") : nothing}
        ${v.synchronized ? html`<div class="sync muted">${v.synchronized}</div>` : nothing}
      </div>
    `;
  }
}

registerCard("hsu-outage-card", HsuOutageCard, "shadcn · Графік відключень", "Статус світла, наступна подія і графік на сьогодні/завтра");
