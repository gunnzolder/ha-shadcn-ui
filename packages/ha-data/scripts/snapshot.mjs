#!/usr/bin/env node
/**
 * Refresh mock fixtures from your real HA:
 *   pnpm snapshot                      (views from SNAPSHOT_VIEWS, default "default_view")
 *   pnpm snapshot -- --views default_view,another --out my_fixture
 *
 * Reads HA_URL + HA_TOKEN from the repo-root .env.local.
 * Takes the Lovelace config of the given views of the default dashboard, collects every entity id
 * they mention, and stores sanitized states (no entity_picture / tokens) in fixtures/<out>.json.
 * The eveus / deye views are skipped unless you list them explicitly.
 */
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createConnection, createLongLivedTokenAuth, getStates } from "home-assistant-js-websocket";

const here = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(here, "../../../.env.local");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const views = (arg("views") ?? process.env.SNAPSHOT_VIEWS ?? "default_view").split(",").map((s) => s.trim());
const out = arg("out") ?? views.join("+");
const { HA_URL, HA_TOKEN } = process.env;
if (!HA_URL || !HA_TOKEN) {
  console.error("Set HA_URL and HA_TOKEN in .env.local");
  process.exit(1);
}

const DROP_ATTRS = new Set(["entity_picture", "entity_picture_local", "access_token", "source_list", "sound_mode_list"]);
const clean = (s) => ({
  entity_id: s.entity_id,
  state: s.state,
  attributes: Object.fromEntries(Object.entries(s.attributes).filter(([k]) => !DROP_ATTRS.has(k))),
  last_changed: s.last_changed,
  last_updated: s.last_updated,
});

const conn = await createConnection({ auth: createLongLivedTokenAuth(HA_URL, HA_TOKEN) });
try {
  const [config, states] = await Promise.all([
    conn.sendMessagePromise({ type: "lovelace/config", url_path: null }),
    getStates(conn),
  ]);
  const byId = Object.fromEntries(states.map((s) => [s.entity_id, s]));
  const picked = (config.views ?? []).filter((v) => views.includes(v.path ?? v.title));
  if (!picked.length) throw new Error(`No views ${views} in the default dashboard`);

  const ids = new Set();
  JSON.stringify(picked, (_k, val) => {
    if (typeof val === "string") for (const m of val.matchAll(/\b[a-z_]+\.[a-z0-9_]+\b/g)) if (byId[m[0]]) ids.add(m[0]);
    return val;
  });

  const fixture = {
    _meta: {
      source: `${HA_URL}/lovelace (${views.join(", ")})`,
      captured_at: new Date().toISOString(),
      note: "Sanitized snapshot (entity_picture/tokens removed). Regenerate with `pnpm snapshot`.",
    },
    view: picked.length === 1 ? picked[0] : picked,
    states: Object.fromEntries([...ids].sort().map((id) => [id, clean(byId[id])])),
  };
  const file = join(here, "../fixtures", `${out}.json`);
  writeFileSync(file, JSON.stringify(fixture, null, 2) + "\n");
  console.log(`✓ ${ids.size} entities from [${views}] → ${file}`);
  console.log("  Review the diff before committing: fixtures are part of the repo.");
} finally {
  conn.close();
}
