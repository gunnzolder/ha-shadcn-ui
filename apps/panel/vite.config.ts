import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const root = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Modes:
 *   vite              → standalone dev on :5173 with mock data (index.html → src/main.tsx)
 *   vite --mode live  → standalone dev against your real HA (HA_URL + HA_TOKEN from .env.local)
 *   vite --mode ha    → dev server that the HA sidebar loads directly (HMR inside real HA,
 *                       real `hass`, no token). Set "Panel dev URL" in the integration options to
 *                       http://<DEV_HOST>:5173/src/dev-entry.ts
 *   vite build        → custom element bundle → custom_components/shadcn_ui/www/panel/panel.js
 */
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, root, "");
  const devHost = env.DEV_HOST || "localhost";

  return {
    envDir: root,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    define: {
      __HSU_SOURCE__: JSON.stringify(mode === "live" ? "live" : "mock"),
      // Only exposed to the dev server. Never shipped: production gets `hass` from HA.
      __HA_URL__: JSON.stringify(command === "serve" ? env.HA_URL ?? "" : ""),
      __HA_TOKEN__: JSON.stringify(command === "serve" && mode === "live" ? env.HA_TOKEN ?? "" : ""),
    },
    server: {
      port: 5173,
      strictPort: true,
      // In "ha" mode the page is HA (another origin) loading our modules into its iframe.
      host: mode === "ha" ? true : undefined,
      cors: mode === "ha" ? true : undefined,
      origin: mode === "ha" ? `http://${devHost}:5173` : undefined,
      hmr: mode === "ha" ? { host: devHost } : undefined,
    },
    // Production assets (fonts) are served by the integration from this static path.
    // Keep in sync with custom_components/shadcn_ui/const.py → URL_BASE.
    base: command === "build" ? "/shadcn_ui_static/panel/" : "/",
    build: {
      outDir: fileURLToPath(new URL("../../custom_components/shadcn_ui/www/panel", import.meta.url)),
      emptyOutDir: true,
      cssCodeSplit: false,
      // Not lib mode: lib mode would base64-inline every font subset (≈1 MB).
      rollupOptions: {
        input: fileURLToPath(new URL("./src/panel-element.tsx", import.meta.url)),
        preserveEntrySignatures: "strict",
        output: {
          entryFileNames: "panel.js",
          assetFileNames: "assets/[name]-[hash][extname]",
          codeSplitting: false,
        },
      },
    },
  };
});
