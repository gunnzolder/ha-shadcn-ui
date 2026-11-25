#!/usr/bin/env node
// Packs custom_components/shadcn_ui (with the built www/) into shadcn_ui.zip for a GitHub release.
// HACS (zip_release) unpacks it into /config/custom_components/shadcn_ui/.
//   HSU_VERSION=1.2.3 node scripts/package.mjs   → also stamps manifest.json version
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = join(root, "custom_components/shadcn_ui");
for (const f of ["www/panel/panel.js", "www/cards/hsu-cards.js"]) {
  if (!existsSync(join(src, f))) {
    console.error(`missing ${f} — run \`pnpm build\` first`);
    process.exit(1);
  }
}

const stage = mkdtempSync(join(tmpdir(), "hsu-"));
cpSync(src, stage, { recursive: true, filter: (p) => !p.includes("__pycache__") && !p.endsWith(".gitkeep") });

const version = process.env.HSU_VERSION;
if (version) {
  const mf = join(stage, "manifest.json");
  const m = JSON.parse(readFileSync(mf, "utf8"));
  m.version = version.replace(/^v/, "");
  writeFileSync(mf, JSON.stringify(m, null, 2) + "\n");
  console.log(`manifest version → ${m.version}`);
}

const out = join(root, "shadcn_ui.zip");
rmSync(out, { force: true });
execFileSync("zip", ["-qr", out, "."], { cwd: stage, stdio: "inherit" });
rmSync(stage, { recursive: true, force: true });
console.log(`wrote ${out}`);
