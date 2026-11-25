/**
 * Playground-only stand-ins for elements that exist inside Home Assistant.
 * Real HA provides <ha-icon>; here we draw the few MDI icons the cards use.
 */
import * as mdi from "@mdi/js";

const toKey = (icon: string) =>
  "mdi" + icon.replace(/^mdi:/, "").split("-").map((p) => p[0]!.toUpperCase() + p.slice(1)).join("");

class HaIconShim extends HTMLElement {
  static observedAttributes = ["icon"];
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }
  render() {
    const path = (mdi as Record<string, string>)[toKey(this.getAttribute("icon") ?? "")] ?? mdi.mdiHelpCircleOutline;
    // Render into a shadow root: touching light DOM during Lit's template cloning breaks its node indices.
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    this.style.display = "inline-flex";
    root.innerHTML = `<svg viewBox="0 0 24 24" width="var(--mdc-icon-size, 24px)" style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)" fill="currentColor"><path d="${path}"/></svg>`;
  }
}
if (!customElements.get("ha-icon")) customElements.define("ha-icon", HaIconShim);
