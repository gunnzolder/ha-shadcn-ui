/**
 * Bundle entry. The integration auto-loads the built file on every HA page
 * (frontend.add_extra_js_url) — no manual Lovelace resource needed.
 *
 *   type: custom:hsu-grid-card
 *   type: custom:hsu-outage-card
 */
import "./grid-card";
import "./outage-card";

declare const __HSU_VERSION__: string | undefined;
const version = typeof __HSU_VERSION__ === "string" ? __HSU_VERSION__ : "dev";
console.info(`%c HSU-CARDS %c ${version} `, "background:#18181b;color:#fafafa;border-radius:4px 0 0 4px", "background:#e4e4e7;color:#18181b;border-radius:0 4px 4px 0");
