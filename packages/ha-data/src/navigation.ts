import type { HassEntities } from "./types";

export type NavSectionId = "main" | "analytics" | "system";

export type NavIconId =
  | "home"
  | "sun"
  | "zap"
  | "car"
  | "battery-charging"
  | "bar-chart"
  | "history"
  | "activity"
  | "settings"
  | "store"
  | "layout-dashboard"
  | "map"
  | "music"
  | "bot"
  | "lightbulb"
  | "thermometer"
  | "shield"
  | "wrench"
  | "link";

export interface NavItem {
  id: string;
  label: string;
  /** Short label used in the compact mobile bottom bar (falls back to `label`). */
  shortLabel?: string;
  path: string;
  icon: NavIconId;
  section: NavSectionId;
  hidden?: boolean;
  /** Pinned items (like "Дім") cannot be hidden or deleted so the user can never lock themselves out. */
  pinned?: boolean;
  adminOnly?: boolean;
  custom?: boolean;
}

export interface NavPrefs {
  version: 1;
  items: NavItem[];
  collapsed?: boolean;
}

export interface NavSectionMeta {
  id: NavSectionId;
  label: string;
}

export const NAV_SECTIONS: readonly NavSectionMeta[] = [
  { id: "main", label: "Головне" },
  { id: "analytics", label: "Аналітика" },
  { id: "system", label: "Система" },
];

export const NAV_ICONS: readonly NavIconId[] = [
  "home",
  "sun",
  "zap",
  "car",
  "battery-charging",
  "bar-chart",
  "history",
  "activity",
  "settings",
  "store",
  "layout-dashboard",
  "map",
  "music",
  "bot",
  "lightbulb",
  "thermometer",
  "shield",
  "wrench",
  "link",
];

const VALID_SECTIONS = new Set<string>(NAV_SECTIONS.map((s) => s.id));
const VALID_ICONS = new Set<string>(NAV_ICONS);

export const DEFAULT_NAV_ITEMS: readonly NavItem[] = [
  { id: "home", label: "Дім", shortLabel: "Дім", path: "/home-ui", icon: "home", section: "main", pinned: true },
  { id: "deye", label: "Інвертор (Deye)", shortLabel: "Deye", path: "/lovelace/deye", icon: "sun", section: "main" },
  { id: "eveus", label: "Зарядка (Eveus)", shortLabel: "Eveus", path: "/lovelace/eveus", icon: "car", section: "main" },
  { id: "energy", label: "Енергія", path: "/energy", icon: "bar-chart", section: "analytics" },
  { id: "history", label: "Історія", path: "/history", icon: "history", section: "analytics" },
  { id: "activity", label: "Події", path: "/logbook", icon: "activity", section: "analytics", hidden: true },
  { id: "config", label: "Налаштування", path: "/config", icon: "settings", section: "system", adminOnly: true },
  { id: "marketplace", label: "Marketplace", path: "/marketplace", icon: "store", section: "system", adminOnly: true },
  {
    id: "overview",
    label: "Старий дашборд",
    path: "/lovelace/default_view",
    icon: "layout-dashboard",
    section: "system",
    hidden: true,
  },
  { id: "map", label: "Карта", path: "/map", icon: "map", section: "system", hidden: true },
  { id: "media", label: "Медіа", path: "/media-browser", icon: "music", section: "system", hidden: true },
];

export const NAV_USER_DATA_KEY = "hsu_nav";

export function defaultNavPrefs(): NavPrefs {
  return {
    version: 1,
    items: DEFAULT_NAV_ITEMS.map((item) => ({ ...item })),
    collapsed: false,
  };
}

export function normalizeNavPath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function sanitizeCustomItem(raw: Record<string, unknown>): NavItem | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const path = typeof raw.path === "string" ? normalizeNavPath(raw.path) : "";
  if (!id || !label || !path) return null;
  const section: NavSectionId =
    typeof raw.section === "string" && VALID_SECTIONS.has(raw.section) ? (raw.section as NavSectionId) : "main";
  const icon: NavIconId =
    typeof raw.icon === "string" && VALID_ICONS.has(raw.icon) ? (raw.icon as NavIconId) : "link";
  return {
    id,
    label,
    shortLabel: typeof raw.shortLabel === "string" && raw.shortLabel.trim() ? raw.shortLabel.trim() : undefined,
    path,
    icon,
    section,
    hidden: raw.hidden === true,
    custom: true,
  };
}

/**
 * Merges persisted user prefs with DEFAULT_NAV_ITEMS:
 * - preserves user ordering, hidden state, and custom items
 * - keeps built-in metadata (path, pinned, adminOnly) fresh and appends newly added built-ins
 * - ensures pinned items are never hidden
 */
export function mergeNavPrefs(saved: unknown): NavPrefs {
  if (!saved || typeof saved !== "object") return defaultNavPrefs();
  const obj = saved as Record<string, unknown>;
  const collapsed = obj.collapsed === true;
  if (!Array.isArray(obj.items)) {
    return { ...defaultNavPrefs(), collapsed };
  }

  const defaultsById = new Map(DEFAULT_NAV_ITEMS.map((i) => [i.id, i]));
  const seen = new Set<string>();
  const merged: NavItem[] = [];

  for (const entry of obj.items) {
    if (!entry || typeof entry !== "object") continue;
    const raw = entry as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id : "";
    if (!id || seen.has(id)) continue;

    const builtin = defaultsById.get(id);
    if (builtin) {
      seen.add(id);
      merged.push({
        ...builtin,
        hidden: builtin.pinned ? false : typeof raw.hidden === "boolean" ? raw.hidden : builtin.hidden,
      });
    } else if (raw.custom === true) {
      const custom = sanitizeCustomItem(raw);
      if (custom) {
        seen.add(custom.id);
        merged.push(custom);
      }
    }
  }

  for (const builtin of DEFAULT_NAV_ITEMS) {
    if (!seen.has(builtin.id)) {
      merged.push({ ...builtin });
    }
  }

  return { version: 1, items: merged, collapsed };
}

export function visibleNavSections(
  prefs: NavPrefs,
  isAdmin: boolean,
): { id: NavSectionId; label: string; items: NavItem[] }[] {
  return NAV_SECTIONS.map((sec) => ({
    id: sec.id,
    label: sec.label,
    items: prefs.items.filter(
      (item) => item.section === sec.id && !item.hidden && (!item.adminOnly || isAdmin),
    ),
  })).filter((sec) => sec.items.length > 0);
}

/** Up to `max` top visible items for the mobile bottom bar (prefers `main` section). */
export function mobileTabItems(prefs: NavPrefs, isAdmin: boolean, max = 3): NavItem[] {
  const visible = prefs.items.filter((item) => !item.hidden && (!item.adminOnly || isAdmin));
  const main = visible.filter((item) => item.section === "main");
  const rest = visible.filter((item) => item.section !== "main");
  return [...main, ...rest].slice(0, max);
}

export function toggleNavItem(prefs: NavPrefs, id: string): NavPrefs {
  return {
    ...prefs,
    items: prefs.items.map((item) => {
      if (item.id !== id || item.pinned) return item;
      return { ...item, hidden: !item.hidden };
    }),
  };
}

/** Moves an item up or down relative to its siblings in the same section. */
export function moveNavItem(prefs: NavPrefs, id: string, direction: "up" | "down"): NavPrefs {
  const target = prefs.items.find((i) => i.id === id);
  if (!target) return prefs;

  const sectionIndices: number[] = [];
  prefs.items.forEach((item, idx) => {
    if (item.section === target.section) sectionIndices.push(idx);
  });

  const posInSection = sectionIndices.findIndex((idx) => prefs.items[idx]!.id === id);
  const swapPos = direction === "up" ? posInSection - 1 : posInSection + 1;
  if (posInSection < 0 || swapPos < 0 || swapPos >= sectionIndices.length) return prefs;

  const a = sectionIndices[posInSection]!;
  const b = sectionIndices[swapPos]!;
  const next = [...prefs.items];
  [next[a], next[b]] = [next[b]!, next[a]!];
  return { ...prefs, items: next };
}

export function addCustomNavItem(
  prefs: NavPrefs,
  input: { label: string; path: string; icon: NavIconId; section: NavSectionId },
): NavPrefs {
  const label = input.label.trim();
  const path = normalizeNavPath(input.path);
  if (!label || !path) return prefs;

  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "link";
  let id = `custom-${slug}`;
  let n = 2;
  const existing = new Set(prefs.items.map((i) => i.id));
  while (existing.has(id)) {
    id = `custom-${slug}-${n++}`;
  }

  const item: NavItem = {
    id,
    label,
    path,
    icon: VALID_ICONS.has(input.icon) ? input.icon : "link",
    section: VALID_SECTIONS.has(input.section) ? input.section : "main",
    hidden: false,
    custom: true,
  };
  return { ...prefs, items: [...prefs.items, item] };
}

export function removeCustomNavItem(prefs: NavPrefs, id: string): NavPrefs {
  return {
    ...prefs,
    items: prefs.items.filter((item) => !(item.id === id && item.custom)),
  };
}

/** Count pending HA `update.*` entities (state === "on") for the Settings badge. */
export function countAvailableUpdates(states: HassEntities | undefined): number {
  if (!states) return 0;
  let count = 0;
  for (const [entityId, entity] of Object.entries(states)) {
    if (entityId.startsWith("update.") && entity.state === "on") {
      count++;
    }
  }
  return count;
}
