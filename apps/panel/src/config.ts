import { DEFAULT_GRID, DEFAULT_OUTAGE_ENTITY, type GridEntities } from "@hsu/ha-data";

/**
 * What the Home view shows. Mirrors lovelace/default_view (see packages/ha-data/fixtures/default_view.json).
 * The eveus / deye views are intentionally not part of this yet.
 * Later this can come from panel config (integration options) instead of code.
 */
export interface SwitchItem {
  entity: string;
  name?: string;
  icon?: "satellite" | "lightbulb" | "lamp";
}

export interface HomeConfig {
  switchGroups: { title?: string; items: SwitchItem[] }[];
  grid: GridEntities;
  outage: string;
  weather: string;
  media: string;
}

export const homeConfig: HomeConfig = {
  switchGroups: [
    { items: [{ entity: "switch.sonoff_10010d79fc", name: "Starlink", icon: "satellite" }] },
    {
      title: "1-й поверх",
      items: [
        { entity: "switch.sonoff_10010508d8", name: "Тераса", icon: "lamp" },
        { entity: "switch.sonoff_100110a5bf", name: "Паркінг", icon: "lightbulb" },
      ],
    },
  ],
  grid: DEFAULT_GRID,
  outage: DEFAULT_OUTAGE_ENTITY,
  weather: "weather.forecast_home",
  media: "media_player.lg_webos_tv_un71006lb",
};
