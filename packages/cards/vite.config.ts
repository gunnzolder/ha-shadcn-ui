import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";

const root = fileURLToPath(new URL("../..", import.meta.url));

/**
 *   vite              → playground on :5174 (dev/index.html) with mock data + scenario switcher
 *   vite --mode live  → playground against your real HA (HA_URL + HA_TOKEN in .env.local)
 *   vite --mode ha    → serve src/index.ts to the real HA: set integration option
 *                       "Cards dev URL" = http://<DEV_HOST>:5174/src/index.ts, reload the dashboard
 *   vite build        → custom_components/shadcn_ui/www/cards/hsu-cards.js (one file, auto-loaded by the integration)
 */
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, root, "");
  const devHost = env.DEV_HOST || "localhost";
  return {
    envDir: root,
    root: command === "serve" ? fileURLToPath(new URL(".", import.meta.url)) : undefined,
    define: {
      __HSU_SOURCE__: JSON.stringify(mode === "live" ? "live" : "mock"),
      __HA_URL__: JSON.stringify(command === "serve" ? env.HA_URL ?? "" : ""),
      __HA_TOKEN__: JSON.stringify(command === "serve" && mode === "live" ? env.HA_TOKEN ?? "" : ""),
      __HSU_VERSION__: JSON.stringify(process.env.HSU_VERSION ?? "dev"),
      "process.env.NODE_ENV": JSON.stringify(command === "build" ? "production" : "development"),
    },
    server: {
      port: 5174,
      strictPort: true,
      open: command === "serve" && mode !== "ha" ? "/dev/" : undefined,
      host: mode === "ha" ? true : undefined,
      cors: mode === "ha" ? true : undefined,
      origin: mode === "ha" ? `http://${devHost}:5174` : undefined,
      hmr: mode === "ha" ? { host: devHost } : undefined,
    },
    build: {
      outDir: fileURLToPath(new URL("../../custom_components/shadcn_ui/www/cards", import.meta.url)),
      emptyOutDir: true,
      lib: {
        entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
        formats: ["es"],
        fileName: () => "hsu-cards.js",
      },
    },
    test: {
      environment: "happy-dom",
    },
  };
});
