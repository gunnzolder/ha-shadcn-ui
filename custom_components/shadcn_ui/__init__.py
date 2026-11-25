"""shadcn UI for Home Assistant.

One integration ships the whole frontend:
  * a sidebar panel  (React + shadcn/ui, built to www/panel/panel.js, rendered in an iframe)
  * Lovelace cards   (Lit, built to www/cards/hsu-cards.js, auto-loaded on every page)

Installed and updated through HACS (Marketplace) from GitHub releases.
For development, the options flow can point the panel / cards at a Vite dev server on your Mac.
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import (
    CARDS_FILE,
    CONF_CARDS_DEV_URL,
    CONF_ICON,
    CONF_PANEL_DEV_URL,
    CONF_REQUIRE_ADMIN,
    CONF_TITLE,
    CONF_URL_PATH,
    DEFAULT_ICON,
    DEFAULT_TITLE,
    DEFAULT_URL_PATH,
    DOMAIN,
    PANEL_ELEMENT,
    PANEL_FILE,
    URL_BASE,
)

_LOGGER = logging.getLogger(__name__)

WWW = Path(__file__).parent / "www"


def _cache_buster(version: str) -> str:
    """Version + build mtime, so a redeployed build is picked up after an integration reload."""
    stamps = []
    for rel in (PANEL_FILE, CARDS_FILE):
        path = WWW / rel
        if path.exists():
            stamps.append(str(path.stat().st_mtime_ns // 1_000_000))
    return "-".join([version, *stamps])


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register static files, the sidebar panel and the Lovelace cards bundle."""
    integration = await async_get_integration(hass, DOMAIN)
    version = str(integration.version)
    data: dict = hass.data.setdefault(DOMAIN, {})

    if not data.get("static_registered"):
        # Static paths can't be unregistered, so register once per HA run.
        await hass.http.async_register_static_paths(
            [StaticPathConfig(URL_BASE, str(WWW), cache_headers=False)]
        )
        data["static_registered"] = True

    v = await hass.async_add_executor_job(_cache_buster, version)
    opts = entry.options

    # --- Lovelace cards -----------------------------------------------------------
    cards_dev = opts.get(CONF_CARDS_DEV_URL)
    cards_url = cards_dev or f"{URL_BASE}/{CARDS_FILE}?v={v}"
    frontend.add_extra_js_url(hass, cards_url)
    data["cards_url"] = cards_url

    # --- Sidebar panel ------------------------------------------------------------
    panel_dev = opts.get(CONF_PANEL_DEV_URL)
    url_path = opts.get(CONF_URL_PATH, DEFAULT_URL_PATH)
    title = opts.get(CONF_TITLE, DEFAULT_TITLE)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=url_path,
        webcomponent_name=PANEL_ELEMENT,
        sidebar_title=f"{title} (dev)" if panel_dev else title,
        sidebar_icon=opts.get(CONF_ICON, DEFAULT_ICON),
        module_url=panel_dev or f"{URL_BASE}/{PANEL_FILE}?v={v}",
        # Own document: Tailwind + Base UI portals work, HA styles don't leak in.
        embed_iframe=True,
        # A dev URL is another origin; skip HA's "trust external script" prompt for it.
        trust_external=bool(panel_dev),
        require_admin=opts.get(CONF_REQUIRE_ADMIN, False),
        config={"version": version, "dev": bool(panel_dev)},
    )
    data["url_path"] = url_path

    if panel_dev or cards_dev:
        _LOGGER.warning(
            "shadcn UI is loading frontend from a dev server (panel=%s, cards=%s)",
            panel_dev,
            cards_dev,
        )

    entry.async_on_unload(entry.add_update_listener(_async_reload))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the panel and the cards script."""
    data: dict = hass.data.get(DOMAIN, {})
    if url_path := data.pop("url_path", None):
        frontend.async_remove_panel(hass, url_path)
    if cards_url := data.pop("cards_url", None):
        frontend.remove_extra_js_url(hass, cards_url)
    return True


async def _async_reload(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Options changed → re-register with the new settings."""
    await hass.config_entries.async_reload(entry.entry_id)
