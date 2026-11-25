# ha-shadcn-ui

Свій UI для Home Assistant на **shadcn/ui** (Base UI · стиль Luma). Один репозиторій поставляє:

| Що | Технології | Де в HA |
|---|---|---|
| **Панель «Дім»** | React 19 + shadcn/ui + Tailwind 4 | Пункт у бічній панелі (custom panel в iframe) |
| **Lovelace-картки** `custom:hsu-*` | Lit + ті самі токени | У будь-якому дашборді |
| **YAML-тема** `shadcn_ui` | згенерована з токенів | Стандартні екрани HA (налаштування, more-info, старі дашборди) |
| **Стиль сайдбару** | `custom-sidebar` + токени | Головне меню HA (`ha-sidebar`), світла й темна теми |

Усе встановлюється й оновлюється як **одна HACS-інтеграція** (з HA 2026.11 HACS вбудований у HA як Marketplace) з GitHub Releases.

```
apps/panel/                 React-панель (shadcn CLI працює тут: npx shadcn add …)
packages/cards/             Lovelace-картки (Lit) + playground
packages/ha-data/           спільний шар даних: hass-подібний API, mock/live/panel-джерела,
                            сценарії, view-model функції (порт Jinja-шаблонів) + фікстури
packages/tokens/            tokens.json → theme.css (панель+картки), themes/shadcn_ui.yaml
                            і themes/custom-sidebar/custom-sidebar-config.yaml
custom_components/shadcn_ui Python-інтеграція: віддає www/, реєструє панель і картки
tests/                      pytest проти справжнього HA core
.github/workflows/          CI, релізи (release-please), пре-релізи з гілок
```

## Швидкий старт

```bash
pnpm install          # Node ≥ 22, pnpm 10 (corepack enable або npm i -g pnpm)
pnpm dev              # панель на :5173 з моками (знімок default_view), перемикач сценаріїв угорі
pnpm dev:cards        # playground карток на :5174
pnpm check            # typecheck + тести + збірка
```

Далі: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — як дебажити (моки → живий HA → HMR прямо в сайдбарі HA), гілки й пайплайн.
Чому так влаштовано: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Відкриті задачі для продовження: [docs/tasks/](docs/tasks/) — зокрема [shadcn-вигляд меню HA](docs/tasks/sidebar-theme.md).

## Встановлення в HA

1. Репозиторій має бути **публічним** на GitHub (HACS не працює з приватними).
2. HACS / Marketplace → ⋮ → *Custom repositories* → URL репо, тип **Integration**.
3. Встановити **shadcn UI** → перезапустити HA → *Settings → Devices & services → Add integration → shadcn UI*.
4. У сайдбарі з'явиться «Дім». Картки доступні в пікері карток як «shadcn · …».
5. (Опційно) **YAML-тема**: скопіювати `themes/shadcn_ui.yaml` у `/config/themes/` → `frontend.reload_themes` → вибрати `shadcn_ui` у профілі.
6. (Опційно) **shadcn-вигляд головного меню (сайдбару)** через [elchininet/custom-sidebar](https://elchininet.github.io/custom-sidebar/) (v17.0.0+ для HA 2026.8+):
   - Встановити **Custom Sidebar** у *Settings → Marketplace* (HA 2026.11+) або HACS.
   - Додати модуль у `configuration.yaml` і перезапустити HA:
     ```yaml
     frontend:
       extra_module_url:
         - /local/community/custom-sidebar/custom-sidebar-plugin.js   # Marketplace (HA 2026.11+)
         # - /hacsfiles/custom-sidebar/custom-sidebar-plugin.js       # HACS (HA < 2026.11)
     ```
   - Скопіювати `themes/custom-sidebar/custom-sidebar-config.yaml` у `/config/www/custom-sidebar-config.yaml` (або запустити `pnpm deploy:ha --theme`).
   - Вибрати тему `shadcn_ui` у профілі та оновити сторінку — світла й темна теми перемикаються автоматично через змінні `--hsu-*`. Порядок пунктів редагується стандартним редактором HA.

Оновлення приходять як «Update available» у HA після кожного релізу.

## Картки

```yaml
type: custom:hsu-grid-card        # Мережа: статус, L1–L3, батарея (deye)
# title: Мережа
# entities: { grid: binary_sensor.deye_grid, battery: sensor.deye_battery, ... }

type: custom:hsu-outage-card      # Графік відключень
entity: sensor.lapka_svitla_queue_4_1
```

> Дашборди `eveus` і `deye` свідомо не зачеплені — їх переробимо окремо.
