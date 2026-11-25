import { describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/default_view.json";
import { createMockSource } from "./sources/mock";
import type { Fixture } from "./types";

describe("mock source", () => {
  it("toggles a switch via callService and notifies subscribers with a new hass object", async () => {
    const onServiceCall = vi.fn();
    const src = createMockSource({ fixture: fixture as unknown as Fixture, tickMs: 0, onServiceCall });
    const listener = vi.fn();
    src.subscribe(listener);
    const before = src.getHass()!;
    await before.callService("switch", "toggle", {}, { entity_id: "switch.sonoff_10010508d8" });
    const after = src.getHass()!;
    expect(after).not.toBe(before);
    expect(after.states["switch.sonoff_10010508d8"]!.state).toBe("on");
    expect(listener).toHaveBeenCalled();
    expect(onServiceCall).toHaveBeenCalledWith(expect.objectContaining({ domain: "switch", service: "toggle" }));
  });

  it("does not toggle unavailable entities", async () => {
    const src = createMockSource({ fixture: fixture as unknown as Fixture, tickMs: 0 });
    await src.getHass()!.callService("media_player", "toggle", {}, { entity_id: "media_player.lg_webos_tv_un71006lb" });
    expect(src.getHass()!.states["media_player.lg_webos_tv_un71006lb"]!.state).toBe("unavailable");
  });

  it("switches scenarios", () => {
    const src = createMockSource({ fixture: fixture as unknown as Fixture, tickMs: 0 });
    src.setScenario("outage");
    expect(src.getHass()!.states["binary_sensor.deye_grid"]!.state).toBe("off");
    src.setScenario("normal");
    expect(src.getHass()!.states["binary_sensor.deye_grid"]!.state).toBe("on");
  });
});
