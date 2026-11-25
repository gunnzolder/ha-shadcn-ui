# ha-shadcn-ui

Свій UI для Home Assistant на **shadcn/ui** (Base UI · стиль Luma). Один репозиторій поставляє:

| Що | Технології | Де в HA |
|---|---|---|
| **Панель «Дім»** | React 19 + shadcn/ui + Tailwind 4 | Пункт у бічній панелі (custom panel в iframe) |
| **Lovelace-картки** `custom:hsu-*` | Lit + ті самі токени | У будь-якому дашборді |
| **YAML-тема** `shadcn_ui` | згенерована з токенів | Стандартні екрани HA (налаштування, more-info, старі дашборди) |

Усе встановлюється й оновлюється як **одна HACS-інтеграція** (з HA 2026.11 HACS вбудований у HA як Marketplace) з GitHub Releases.

```
apps/panel/                 React-панель (shadcn CLI працює тут: npx shadcn add …)
packages/cards/             Lovelace-картки (Lit) + playground
packages/ha-data/           спільний шар даних: hass-подібний API, mock/live/panel-джерела,
                            сценарії, view-model функції (порт Jinja-шаблонів) + фікстури
packages/tokens/            tokens.json → theme.css (панель+картки) і themes/shadcn_ui.yaml (HA)
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

## Встановлення в HA

1. Репозиторій має бути **публічним** на GitHub (HACS не працює з приватними).
2. HACS / Marketplace → ⋮ → *Custom repositories* → URL репо, тип **Integration**.
3. Встановити **shadcn UI** → перезапустити HA → *Settings → Devices & services → Add integration → shadcn UI*.
4. У сайдбарі з'явиться «Дім». Картки доступні в пікері карток як «shadcn · …».
5. (Опційно) тема: скопіювати `themes/shadcn_ui.yaml` у `/config/themes/` → `frontend.reload_themes` → вибрати в профілі.

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
