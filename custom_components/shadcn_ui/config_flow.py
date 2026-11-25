"""Config + options flow for shadcn UI."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback

from .const import (
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
)


class ShadcnUiConfigFlow(ConfigFlow, domain=DOMAIN):
    """Single-instance setup: nothing to ask, everything lives in options."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="shadcn UI", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return ShadcnUiOptionsFlow()


def _valid_dev_url(value: str) -> str:
    value = value.strip()
    if value and not value.startswith(("http://", "https://")):
        raise vol.Invalid("must start with http:// or https://")
    return value


class ShadcnUiOptionsFlow(OptionsFlow):
    """Sidebar settings + dev URLs (point HA at `pnpm dev:ha` on your Mac)."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                user_input[CONF_PANEL_DEV_URL] = _valid_dev_url(user_input.get(CONF_PANEL_DEV_URL, ""))
                user_input[CONF_CARDS_DEV_URL] = _valid_dev_url(user_input.get(CONF_CARDS_DEV_URL, ""))
            except vol.Invalid:
                errors["base"] = "invalid_url"
            else:
                # Empty string = use the bundled build.
                cleaned = {k: v for k, v in user_input.items() if v != ""}
                return self.async_create_entry(data=cleaned)

        o = self.config_entry.options
        schema = vol.Schema(
            {
                vol.Optional(CONF_TITLE, default=o.get(CONF_TITLE, DEFAULT_TITLE)): str,
                vol.Optional(CONF_ICON, default=o.get(CONF_ICON, DEFAULT_ICON)): str,
                vol.Optional(CONF_URL_PATH, default=o.get(CONF_URL_PATH, DEFAULT_URL_PATH)): str,
                vol.Optional(CONF_REQUIRE_ADMIN, default=o.get(CONF_REQUIRE_ADMIN, False)): bool,
                vol.Optional(CONF_PANEL_DEV_URL, default=o.get(CONF_PANEL_DEV_URL, "")): str,
                vol.Optional(CONF_CARDS_DEV_URL, default=o.get(CONF_CARDS_DEV_URL, "")): str,
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)
