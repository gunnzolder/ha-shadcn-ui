# ha-shadcn-ui

Свій UI для Home Assistant на **shadcn/ui** (Base UI · стиль Luma). Один репозиторій поставляє:

| Що | Технології | Де в HA |
|---|---|---|
| **Панель «Дім»** | React 19 + shadcn/ui + Tailwind 4 | Стартова сторінка `/home-ui` (custom panel в iframe) зі своєю десктопною й мобільною навігацією та редактором меню |
| **Lovelace-картки** `custom:hsu-*` | Lit + ті самі токени | У будь-якому дашборді |
| **YAML-тема** `shadcn_ui` | згенерована з токенів | Стандартні екрани HA (налаштування, more-info, старі дашборди) |
| **Конфіг сайдбару** | `custom-sidebar` + токени | Ховає дубльоване меню HA на `/home-ui`, редіректить `/` → `/home-ui`, стилізує висувний drawer на інших екранах HA |

Усе встановлюється й оновлюється як **одна HACS-інтеграція** (з HA 2026.11 HACS вбудований у HA як Marketplace) з GitHub Releases.

```
apps/panel/                 React-панель + AppShell навігація (shadcn CLI працює тут: npx shadcn add …)
packages/cards/             Lovelace-картки (Lit) + playground
packages/ha-data/           спільний шар даних: hass-подібний API, mock/live/panel-джерела,
                            сценарії, domain.ts + navigation.ts (чисті функції) + фікстури
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
Архів брифів задач: [docs/tasks/](docs/tasks/).

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
   - Вибрати тему `shadcn_ui` у профілі та оновити сторінку: відкриття `/` переходить на `/home-ui` («Дім»), стандартний сайдбар HA ховається (`sidebar_mode: "hidden"`), щоб не дублюватись із нашим shadcn-сайдбаром, а на інших сторінках HA (`/lovelace/deye`, `/lovelace/eveus`, `/config`) лишається кнопка `☰`.
   - Керувати пунктами меню (вмикати/вимикати, сортувати, додавати власні шляхи HA) можна прямо в інтерфейсі через **«Налаштувати меню»** (налаштування синхронізуються між пристроями в профілі HA).

Оновлення інтеграції (панель «Дім», картки `custom:hsu-*` та Python-частина) приходять як «Update available» у HA після кожного GitHub Release. Файли `themes/shadcn_ui.yaml` і `custom-sidebar-config.yaml` оновлюються окремо (`pnpm deploy:ha --theme`), коли змінюються токени або конфіг сайдбару.

## Картки

```yaml
type: custom:hsu-grid-card        # Мережа: статус, L1–L3, батарея (deye)
# title: Мережа
# entities: { grid: binary_sensor.deye_grid, battery: sensor.deye_battery, ... }

type: custom:hsu-outage-card      # Графік відключень
entity: sensor.lapka_svitla_queue_4_1
```

> Дашборди `eveus` і `deye` свідомо не зачеплені — їх переробимо окремо.
