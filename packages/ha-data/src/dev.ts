import defaultFixture from "../fixtures/default_view.json";
import { createLiveSource } from "./sources/live";
import { createMockSource } from "./sources/mock";
import type { Fixture, HassSource } from "./types";

export interface DevSourceEnv {
  /** "mock" (default) | "live" */
  mode?: string;
  haUrl?: string;
  haToken?: string;
}

/**
 * Picks the data source for standalone dev (outside HA):
 *   ?source=live|mock     overrides env
 *   ?scenario=outage      mock scenario
 *   ?dark=1               dark mode
 */
export function resolveDevSource(env: DevSourceEnv, search = globalThis.location?.search ?? ""): HassSource {
  const q = new URLSearchParams(search);
  const mode = q.get("source") ?? env.mode ?? "mock";
  const dark = q.get("dark") === "1";
  if (mode === "live") {
    if (!env.haUrl || !env.haToken) {
      console.warn("[hsu] live mode needs HA_URL + HA_TOKEN in .env.local — falling back to mock");
    } else {
      return createLiveSource({ url: env.haUrl, token: env.haToken, darkMode: dark });
    }
  }
  return createMockSource({
    fixture: defaultFixture as unknown as Fixture,
    scenario: q.get("scenario") ?? undefined,
    darkMode: dark,
    onServiceCall: (c) => console.info("[hsu mock] service", c),
  });
}
