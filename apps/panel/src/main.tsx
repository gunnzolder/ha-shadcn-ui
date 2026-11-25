// Standalone dev entry (index.html). Not part of the production bundle.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { resolveDevSource } from "@hsu/ha-data";
import "./index.css";
import { App } from "./App";
import { DevToolbar } from "./dev/DevToolbar";

declare const __HSU_SOURCE__: string;
declare const __HA_URL__: string;
declare const __HA_TOKEN__: string;

const source = resolveDevSource({ mode: __HSU_SOURCE__, haUrl: __HA_URL__, haToken: __HA_TOKEN__ });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App source={source} root={document.documentElement} toolbar={<DevToolbar source={source} />} />
  </StrictMode>,
);
