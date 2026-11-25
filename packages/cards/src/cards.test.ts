import { beforeAll, describe, expect, it } from "vitest";
import fixture from "@hsu/ha-data/fixtures/default_view.json";
import { createMockSource, type Fixture } from "@hsu/ha-data";
import type { HsuGridCard } from "./grid-card";
import type { HsuOutageCard } from "./outage-card";

beforeAll(async () => {
  await import("./index");
});

async function mount<T extends HTMLElement>(tag: string, config: object, scenario = "normal") {
  const src = createMockSource({ fixture: fixture as unknown as Fixture, tickMs: 0, scenario });
  const el = document.createElement(tag) as T & { setConfig(c: object): void; hass: unknown; updateComplete: Promise<boolean> };
  el.setConfig({ type: `custom:${tag}`, ...config });
  el.hass = src.getHass();
  document.body.appendChild(el);
  await el.updateComplete;
  return { el, src, text: () => el.shadowRoot!.textContent!.replace(/\s+/g, " ") };
}

describe("Lovelace cards", () => {
  it("registers in window.customCards (card picker)", () => {
    expect(window.customCards?.map((c) => c.type)).toEqual(expect.arrayContaining(["hsu-grid-card", "hsu-outage-card"]));
  });

  it("grid card renders snapshot values", async () => {
    const { text } = await mount<HsuGridCard>("hsu-grid-card", {});
    expect(text()).toContain("Мережа є");
    expect(text()).toContain("219");
    expect(text()).toContain("90%");
  });

  it("grid card shows outage", async () => {
    const { el } = await mount<HsuGridCard>("hsu-grid-card", {}, "outage");
    expect(el.shadowRoot!.querySelector(".badge")!.getAttribute("data-status")).toBe("off");
  });

  it("grid card rejects bad config", () => {
    const el = document.createElement("hsu-grid-card") as HsuGridCard;
    expect(() => el.setConfig({ type: "x", entities: { phases: ["a"] as never } })).toThrow();
  });

  it("outage card renders schedule", async () => {
    const { text } = await mount<HsuOutageCard>("hsu-outage-card", {});
    expect(text()).toContain("Світло є");
    expect(text()).toContain("16:30 – 21:30");
  });
});
