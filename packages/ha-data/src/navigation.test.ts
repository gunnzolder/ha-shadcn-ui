import { describe, expect, it } from "vitest";
import {
  DEFAULT_NAV_ITEMS,
  addCustomNavItem,
  countAvailableUpdates,
  defaultNavPrefs,
  mergeNavPrefs,
  mobileTabItems,
  moveNavItem,
  normalizeNavPath,
  removeCustomNavItem,
  toggleNavItem,
  visibleNavSections,
} from "./navigation";

describe("navigation prefs", () => {
  it("merges defaults cleanly when saved prefs are empty or malformed", () => {
    expect(mergeNavPrefs(null).items).toHaveLength(DEFAULT_NAV_ITEMS.length);
    expect(mergeNavPrefs({ items: "bad" }).items).toHaveLength(DEFAULT_NAV_ITEMS.length);
  });

  it("keeps user order, hidden flags, custom items, and never hides pinned items", () => {
    const merged = mergeNavPrefs({
      version: 1,
      collapsed: true,
      items: [
        { id: "eveus", hidden: false },
        { id: "home", hidden: true },
        { id: "custom-auto", label: "Автоматизації", path: "config/automation/dashboard", icon: "bot", section: "system", custom: true },
      ],
    });
    expect(merged.collapsed).toBe(true);
    expect(merged.items[0]?.id).toBe("eveus");
    expect(merged.items.find((i) => i.id === "home")?.hidden).toBe(false);
    const custom = merged.items.find((i) => i.id === "custom-auto");
    expect(custom?.path).toBe("/config/automation/dashboard");
    expect(custom?.custom).toBe(true);
    expect(merged.items.some((i) => i.id === "deye")).toBe(true);
  });

  it("filters hidden items and admin-only sections", () => {
    const prefs = defaultNavPrefs();
    const adminSections = visibleNavSections(prefs, true);
    expect(adminSections.map((s) => s.id)).toEqual(["main", "analytics", "system"]);
    expect(adminSections[0]!.items.map((i) => i.id)).toEqual(["home", "deye", "eveus"]);

    const userSections = visibleNavSections(prefs, false);
    expect(userSections.map((s) => s.id)).toEqual(["main", "analytics"]);
  });

  it("picks top 3 visible main items for the mobile bottom bar", () => {
    const prefs = defaultNavPrefs();
    expect(mobileTabItems(prefs, true).map((i) => i.id)).toEqual(["home", "deye", "eveus"]);

    const hiddenDeye = toggleNavItem(prefs, "deye");
    expect(mobileTabItems(hiddenDeye, true).map((i) => i.id)).toEqual(["home", "eveus", "energy"]);
  });

  it("toggles visibility except for pinned items", () => {
    const prefs = defaultNavPrefs();
    expect(toggleNavItem(prefs, "home").items.find((i) => i.id === "home")?.hidden).toBeFalsy();
    expect(toggleNavItem(prefs, "deye").items.find((i) => i.id === "deye")?.hidden).toBe(true);
  });

  it("reorders items within their section", () => {
    const prefs = defaultNavPrefs();
    const moved = moveNavItem(prefs, "eveus", "up");
    const mainIds = moved.items.filter((i) => i.section === "main").map((i) => i.id);
    expect(mainIds).toEqual(["home", "eveus", "deye"]);
  });

  it("adds and removes custom items with normalized paths", () => {
    let prefs = defaultNavPrefs();
    prefs = addCustomNavItem(prefs, {
      label: "Автоматизації",
      path: "config/automation/dashboard",
      icon: "bot",
      section: "system",
    });
    const added = prefs.items.find((i) => i.custom);
    expect(added?.path).toBe("/config/automation/dashboard");
    expect(normalizeNavPath("  /foo ")).toBe("/foo");

    const afterDeleteBuiltin = removeCustomNavItem(prefs, "deye");
    expect(afterDeleteBuiltin.items.some((i) => i.id === "deye")).toBe(true);

    const afterDeleteCustom = removeCustomNavItem(prefs, added!.id);
    expect(afterDeleteCustom.items.some((i) => i.id === added!.id)).toBe(false);
  });

  it("counts pending HA updates", () => {
    expect(
      countAvailableUpdates({
        "update.core": { entity_id: "update.core", state: "on", attributes: {}, last_changed: "", last_updated: "" },
        "update.os": { entity_id: "update.os", state: "off", attributes: {}, last_changed: "", last_updated: "" },
        "sensor.temp": { entity_id: "sensor.temp", state: "on", attributes: {}, last_changed: "", last_updated: "" },
      }),
    ).toBe(1);
  });
});
