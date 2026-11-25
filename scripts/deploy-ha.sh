#!/usr/bin/env bash
# Fast path for testing the CURRENT BRANCH on your real HA without a release:
#   build → copy integration to HA → reload the config entry (frontend changes).
# Flags:
#   --theme    also copy themes/shadcn_ui.yaml → themes/ and custom-sidebar-config.yaml → www/,
#              and call frontend.reload_themes via REST (custom-sidebar reloads on page refresh;
#              it appends a random query hash with cache: 'no-store' so no manual cache-busting needed).
#   --restart  restart HA instead of reloading the config entry (needed for Python changes).
#
# Needs in .env.local:  HA_CONFIG_TARGET (Samba mount like /Volumes/config, or user@host:/config for the SSH add-on)
#                       HA_URL + HA_TOKEN (for reload/restart through the REST API)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; [ -f .env.local ] && . ./.env.local; set +a

DEPLOY_THEME=0
RESTART_HA=0
for arg in "$@"; do
  case "$arg" in
    --theme) DEPLOY_THEME=1 ;;
    --restart) RESTART_HA=1 ;;
    *)
      echo "Unknown flag: $arg (supported: --theme, --restart)" >&2
      exit 2
      ;;
  esac
done

: "${HA_CONFIG_TARGET:?set HA_CONFIG_TARGET in .env.local}"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)
SHA=$(git rev-parse --short HEAD 2>/dev/null || echo 0000000)
export HSU_VERSION="0.0.0-dev.${BRANCH//[^a-zA-Z0-9]/-}.${SHA}"

pnpm build
echo "→ deploying $HSU_VERSION to $HA_CONFIG_TARGET/custom_components/shadcn_ui"
rsync -a --delete --exclude "__pycache__" --exclude ".gitkeep" \
  custom_components/shadcn_ui/ "$HA_CONFIG_TARGET/custom_components/shadcn_ui/"

if [ "$DEPLOY_THEME" -eq 1 ]; then
  if [[ "$HA_CONFIG_TARGET" != *:* ]]; then
    mkdir -p "$HA_CONFIG_TARGET/themes" "$HA_CONFIG_TARGET/www"
  fi
  echo "→ deploying themes/shadcn_ui.yaml to $HA_CONFIG_TARGET/themes/"
  rsync -a themes/shadcn_ui.yaml "$HA_CONFIG_TARGET/themes/shadcn_ui.yaml"
  echo "→ deploying themes/custom-sidebar/custom-sidebar-config.yaml to $HA_CONFIG_TARGET/www/"
  rsync -a themes/custom-sidebar/custom-sidebar-config.yaml "$HA_CONFIG_TARGET/www/custom-sidebar-config.yaml"
fi

if [ -z "${HA_URL:-}" ] || [ -z "${HA_TOKEN:-}" ]; then
  echo "HA_URL/HA_TOKEN not set — reload the integration (and themes if --theme) manually"
  exit 0
fi
auth=(-H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json")

if [ "$RESTART_HA" -eq 1 ]; then
  curl -fsS -X POST "${auth[@]}" "$HA_URL/api/services/homeassistant/restart" >/dev/null
  echo "✓ HA restarting"
  exit 0
fi

if [ "$DEPLOY_THEME" -eq 1 ]; then
  curl -fsS -X POST "${auth[@]}" "$HA_URL/api/services/frontend/reload_themes" >/dev/null
  echo "✓ themes reloaded"
fi

ENTRY_ID=$(curl -fsS "${auth[@]}" "$HA_URL/api/config/config_entries/entry?domain=shadcn_ui" \
  | python3 -c 'import sys,json; e=json.load(sys.stdin); print(e[0]["entry_id"] if e else "")')
if [ -z "$ENTRY_ID" ]; then
  echo "Integration not added yet: Settings → Devices & services → Add integration → shadcn UI (needs one HA restart first)"
  exit 0
fi
curl -fsS -X POST "${auth[@]}" "$HA_URL/api/config/config_entries/entry/$ENTRY_ID/reload" >/dev/null
echo "✓ reloaded — refresh the browser (Cmd+Shift+R)"
