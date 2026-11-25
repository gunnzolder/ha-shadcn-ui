# Notes for coding agents

**Task briefs / history:** `docs/tasks/` (`sidebar-theme.md` — Variant 2 + Variant 3 completed in v0.2.0–v0.3.0).

- Package manager: pnpm workspaces. Node ≥ 22.
- Verify before claiming done: `pnpm check` (typecheck + vitest + build) and `pytest -q` (needs `pip install -r requirements_test.txt` + matching `home-assistant-frontend`).
- Data/logic goes in `packages/ha-data` (pure, tested — `domain.ts`, `navigation.ts`); UI only renders view-models.
- Navigation shell (`apps/panel/src/components/nav/`): desktop collapsible sidebar + mobile bottom bar/Sheet + in-app Menu Editor persisted via HA `frontend/set_user_data` (`key: "hsu_nav"`). Parent SPA navigation uses `window.parent.customPanel.navigate(path)`.
- Never edit `packages/tokens/theme.css`, `themes/shadcn_ui.yaml` or `themes/custom-sidebar/custom-sidebar-config.yaml` by hand — edit `tokens.json` / `build.mjs`, run `pnpm theme`.
- shadcn components: `cd apps/panel && npx shadcn add <name>`; don't hand-edit `src/components/ui/*` unless necessary (CLI updates).
- Do not touch the HA `eveus` / `deye` dashboards — they are being redesigned separately (keep them accessible via `/lovelace/deye` and `/lovelace/eveus`).
- Mock fixtures are sanitized snapshots; never commit tokens, entity_picture URLs or `.env.local`.
