# Notes for coding agents

**Open tasks / briefs:** `docs/tasks/` — start with `docs/tasks/sidebar-theme.md`.

- Package manager: pnpm workspaces. Node ≥ 22.
- Verify before claiming done: `pnpm check` (typecheck + vitest + build) and `pytest -q` (needs `pip install -r requirements_test.txt` + matching `home-assistant-frontend`).
- Data/logic goes in `packages/ha-data` (pure, tested); UI only renders view-models.
- Never edit `packages/tokens/theme.css`, `themes/shadcn_ui.yaml` or `themes/custom-sidebar/custom-sidebar-config.yaml` by hand — edit `tokens.json` / `build.mjs`, run `pnpm theme`.
- shadcn components: `cd apps/panel && npx shadcn add <name>`; don't hand-edit `src/components/ui/*` unless necessary (CLI updates).
- Do not touch the HA `eveus` / `deye` dashboards — they are being redesigned separately.
- Mock fixtures are sanitized snapshots; never commit tokens, entity_picture URLs or `.env.local`.
