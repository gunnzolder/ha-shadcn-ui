import { describe, expect, it } from "vitest";
import fixture from "../fixtures/default_view.json";
import { deriveGrid, deriveOutage } from "./domain";
import { getScenario, scenarios } from "./scenarios";
import type { HassEntities } from "./types";

const base = () => structuredClone(fixture.states) as unknown as HassEntities;
const withScenario = (id: string) => {
  const s = base();
  getScenario(id).apply(s);
  return s;
};

describe("deriveGrid (port of the 'Мережа' Jinja template)", () => {
  it("snapshot → on, battery ok", () => {
    const v = deriveGrid(base());
    expect(v.status).toBe("on");
    expect(v.battery).toEqual({ level: "ok", percent: 90 });
    expect(v.phases.map((p) => p.volts)).toEqual([219.4, 219.6, 220.1]);
  });

  it("outage → off", () => expect(deriveGrid(withScenario("outage")).status).toBe("off"));
  it("grid off but a phase has voltage → error", () => expect(deriveGrid(withScenario("phase-loss")).status).toBe("error"));
  it("alarm != OK → error with reason", () => {
    const v = deriveGrid(withScenario("fault"));
    expect(v.status).toBe("error");
    expect(v.reason).toBe("Grid phase failure");
  });
  it("inverter offline → unavailable", () => {
    const v = deriveGrid(withScenario("inverter-offline"));
    expect(v.status).toBe("unavailable");
    expect(v.battery.level).toBe("unavailable");
  });
  it("battery ≤ 30 → low", () => expect(deriveGrid(withScenario("low-battery")).battery.level).toBe("low"));
});

describe("deriveOutage (port of the 'За графіком' Jinja template)", () => {
  it("snapshot → power with schedule", () => {
    const v = deriveOutage(base());
    expect(v.status).toBe("power");
    expect(v.queue).toBe("4.1");
    expect(v.today?.intervals).toHaveLength(2);
    expect(v.tomorrow?.intervals).toEqual([]);
  });
  it("outage scenario → outage", () => expect(deriveOutage(withScenario("outage")).status).toBe("outage"));
  it("missing entity → unavailable", () => expect(deriveOutage({}).status).toBe("unavailable"));
});

describe("scenarios", () => {
  it("all apply without throwing", () => {
    for (const s of scenarios) expect(() => s.apply(base())).not.toThrow();
  });
});
