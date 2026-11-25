#!/usr/bin/env bash
# Fast path for testing the CURRENT BRANCH on your real HA without a release:
#   build → copy integration to HA → reload the config entry (frontend changes) .
# Python changes (custom_components/**.py) still need an HA restart: pass --restart.
#
# Needs in .env.local:  HA_CONFIG_TARGET (Samba mount like /Volumes/config, or user@host:/config for the SSH add-on)
#                       HA_URL + HA_TOKEN (for reload/restart through the REST API)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; [ -f .env.local ] && . ./.env.local; set +a

: "${HA_CONFIG_TARGET:?set HA_CONFIG_TARGET in .env.local}"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)
SHA=$(git rev-parse --short HEAD 2>/dev/null || echo 0000000)
export HSU_VERSION="0.0.0-dev.${BRANCH//[^a-zA-Z0-9]/-}.${SHA}"

pnpm build
echo "→ deploying $HSU_VERSION to $HA_CONFIG_TARGET/custom_components/shadcn_ui"
rsync -a --delete --exclude "__pycache__" --exclude ".gitkeep" \
  custom_components/shadcn_ui/ "$HA_CONFIG_TARGET/custom_components/shadcn_ui/"

if [ -z "${HA_URL:-}" ] || [ -z "${HA_TOKEN:-}" ]; then
  echo "HA_URL/HA_TOKEN not set — reload the integration manually (Settings → Devices & services → shadcn UI → Reload)"
  exit 0
fi
auth=(-H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json")

if [ "${1:-}" = "--restart" ]; then
  curl -fsS -X POST "${auth[@]}" "$HA_URL/api/services/homeassistant/restart" >/dev/null
  echo "✓ HA restarting"
  exit 0
fi

ENTRY_ID=$(curl -fsS "${auth[@]}" "$HA_URL/api/config/config_entries/entry?domain=shadcn_ui" \
  | python3 -c 'import sys,json; e=json.load(sys.stdin); print(e[0]["entry_id"] if e else "")')
if [ -z "$ENTRY_ID" ]; then
  echo "Integration not added yet: Settings → Devices & services → Add integration → shadcn UI (needs one HA restart first)"
  exit 0
fi
curl -fsS -X POST "${auth[@]}" "$HA_URL/api/config/config_entries/entry/$ENTRY_ID/reload" >/dev/null
echo "✓ reloaded — refresh the browser (Cmd+Shift+R)"
