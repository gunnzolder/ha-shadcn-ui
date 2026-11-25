/**
 * Safe bridge between our embedded iframe panel (<hsu-panel>) and the parent Home Assistant shell.
 * All parent accesses are wrapped in try/catch so standalone dev mode (`pnpm dev`) works cleanly.
 */

interface ParentWithCustomPanel extends Window {
  customPanel?: {
    navigate?: (path: string, options?: { replace?: boolean }) => void;
  };
}

function getParentWindow(): ParentWithCustomPanel | null {
  try {
    if (window.parent && window.parent !== window && window.parent.document) {
      return window.parent as ParentWithCustomPanel;
    }
  } catch {
    // Cross-origin (e.g. dev mode) — fall back cleanly.
  }
  return null;
}

function getHomeAssistantRoot(parentWin: Window): HTMLElement | null {
  try {
    return parentWin.document.querySelector("home-assistant");
  } catch {
    return null;
  }
}

function getHomeAssistantMain(parentWin: Window): HTMLElement | null {
  const ha = getHomeAssistantRoot(parentWin);
  return (ha?.shadowRoot?.querySelector("home-assistant-main") as HTMLElement | null) ?? null;
}

export function isEmbeddedInHA(): boolean {
  return getParentWindow() !== null;
}

/** Navigate the parent Home Assistant window (SPA transition, no full page reload). */
export function navigateHA(path: string, replace = false): boolean {
  const parentWin = getParentWindow();
  if (!parentWin) {
    console.info("[hsu] navigateHA (standalone dev):", path);
    return false;
  }
  if (typeof parentWin.customPanel?.navigate === "function") {
    parentWin.customPanel.navigate(path, { replace });
    return true;
  }
  try {
    if (replace) parentWin.history.replaceState(null, "", path);
    else parentWin.history.pushState(null, "", path);
    parentWin.dispatchEvent(new CustomEvent("location-changed", { detail: { replace } }));
    return true;
  } catch {
    parentWin.location.assign(path);
    return true;
  }
}

/** Open Home Assistant's built-in Notifications drawer. */
export function openHANotifications(): boolean {
  const parentWin = getParentWindow();
  if (!parentWin) return false;
  const main = getHomeAssistantMain(parentWin);
  if (!main) return false;
  main.dispatchEvent(new CustomEvent("hass-show-notifications", { bubbles: true, composed: true }));
  return true;
}

/** Switch Home Assistant's light/dark theme mode live without reloading. */
export function setHAThemeMode(dark: boolean): boolean {
  const parentWin = getParentWindow();
  if (!parentWin) return false;
  const ha = getHomeAssistantRoot(parentWin);
  if (!ha) return false;
  ha.dispatchEvent(
    new CustomEvent("settheme", {
      detail: { theme: "shadcn_ui", dark },
      bubbles: true,
      composed: true,
    }),
  );
  return true;
}

/** Open Home Assistant's native slide-over sidebar drawer (escape hatch). */
export function openHASidebarDrawer(): boolean {
  const parentWin = getParentWindow();
  if (!parentWin) return false;
  const main = getHomeAssistantMain(parentWin);
  if (!main) return false;
  main.dispatchEvent(new CustomEvent("hass-toggle-menu", { detail: { open: true }, bubbles: true, composed: true }));
  return true;
}
