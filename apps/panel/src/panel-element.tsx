/**
 * Production entry: the <hsu-panel> custom element that Home Assistant mounts in the sidebar.
 *
 * HA sets `hass` (full state, new object on every change), `narrow`, `route`, `panel` on it.
 * The integration registers the panel with `embed_iframe: true`, so this element lives in its own
 * document: Tailwind, Base UI portals (popovers, dialogs, selects) and dark mode all behave like a
 * normal web page — no shadow-DOM fights with HA's styles.
 */
import { createRoot, type Root } from "react-dom/client";
import { createPanelSource, type HassLike } from "@hsu/ha-data";
import css from "./index.css?inline";
import { App } from "./App";

const TAG = "hsu-panel";
const STYLE_ID = "hsu-panel-styles";

function injectStyles(el: HTMLElement) {
  // In `vite --mode ha` the dev entry imports index.css itself (with HMR).
  if (import.meta.env.DEV) return;
  const rootNode = el.getRootNode();
  const target = rootNode instanceof ShadowRoot ? rootNode : el.ownerDocument.head;
  if (target.querySelector(`#${STYLE_ID}`)) return;
  const style = el.ownerDocument.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  target.appendChild(style);
}

class HsuPanel extends HTMLElement {
  private source = createPanelSource();
  private root: Root | undefined;

  narrow = false;
  route: unknown;
  panel: unknown;

  set hass(hass: HassLike) {
    this.source.push(hass);
  }

  connectedCallback() {
    if (this.root) return;
    injectStyles(this);
    this.root = createRoot(this);
    this.root.render(<App source={this.source} root={this.ownerDocument.documentElement} />);
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, HsuPanel);
