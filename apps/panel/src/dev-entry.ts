/**
 * Loaded BY HOME ASSISTANT from the Vite dev server (`pnpm dev:ha`) when the integration option
 * "Panel dev URL" = http://<DEV_HOST>:5173/src/dev-entry.ts
 * → your local code, real `hass`, hot reload — right inside the HA sidebar.
 */
// React Fast Refresh preamble (normally injected into index.html by @vitejs/plugin-react).
// @ts-expect-error — virtual module served by the Vite dev server
import RefreshRuntime from "/@react-refresh";

const w = window as unknown as Record<string, unknown>;
RefreshRuntime.injectIntoGlobalHook(window);
w.$RefreshReg$ = () => {};
w.$RefreshSig$ = () => (type: unknown) => type;
w.__vite_plugin_react_preamble_installed__ = true;

await import("./index.css");
await import("./panel-element");
console.info("[hsu] panel loaded from dev server", import.meta.url);
