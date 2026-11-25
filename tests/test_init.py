"""Setup / options / unload of the integration against a real (test) Home Assistant core."""

from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL, DATA_PANELS
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.shadcn_ui.const import DOMAIN


async def _setup(hass: HomeAssistant, options: dict | None = None) -> MockConfigEntry:
    await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, data={}, options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def _panel_custom(hass: HomeAssistant, url_path: str = "home-ui") -> dict:
    return hass.data[DATA_PANELS][url_path].config["_panel_custom"]


async def test_registers_panel_and_cards(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    assert entry.state is ConfigEntryState.LOADED

    panel = _panel_custom(hass)
    assert panel["name"] == "hsu-panel"
    assert panel["embed_iframe"] is True
    assert panel["module_url"].startswith("/shadcn_ui_static/panel/panel.js?v=")
    assert any(u.startswith("/shadcn_ui_static/cards/hsu-cards.js?v=") for u in hass.data[DATA_EXTRA_MODULE_URL].urls)


async def test_dev_urls_override_bundle(hass: HomeAssistant) -> None:
    await _setup(
        hass,
        {
            "panel_dev_url": "http://mac.local:5173/src/dev-entry.ts",
            "cards_dev_url": "http://mac.local:5174/src/index.ts",
        },
    )
    panel = _panel_custom(hass)
    assert panel["module_url"] == "http://mac.local:5173/src/dev-entry.ts"
    assert panel["trust_external"] is True
    assert hass.data[DATA_PANELS]["home-ui"].sidebar_title.endswith("(dev)")
    assert "http://mac.local:5174/src/index.ts" in hass.data[DATA_EXTRA_MODULE_URL].urls


async def test_unload_removes_panel_and_cards(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert "home-ui" not in hass.data[DATA_PANELS]
    assert not any("hsu-cards" in u for u in hass.data[DATA_EXTRA_MODULE_URL].urls)


async def test_options_flow_rejects_bad_url(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"panel_dev_url": "mac.local:5173"}
    )
    assert result["errors"] == {"base": "invalid_url"}


async def test_options_flow_reloads_with_new_title(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    await hass.config_entries.options.async_configure(result["flow_id"], {"sidebar_title": "Хата"})
    await hass.async_block_till_done()
    assert hass.data[DATA_PANELS]["home-ui"].sidebar_title == "Хата"


async def test_config_flow_creates_entry(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] == "create_entry"
