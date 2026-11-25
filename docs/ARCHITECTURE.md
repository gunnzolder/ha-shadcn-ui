# Архітектура

## Чому одна custom integration, а не add-on чи окремі HACS-плагіни

| Варіант | + | − |
|---|---|---|
| **Custom integration (обрано)** | одна установка/оновлення через HACS; панель отримує `hass` від HA напряму (без токенів і окремої авторизації); картки підвантажуються автоматично (`add_extra_js_url`); працює на будь-якому типі встановлення HA | Python-частина потребує рестарту HA при змінах (фронтенд — ні) |
| Add-on (Ingress) | повна свобода, свій сервер | тільки HAOS/Supervised; окрема авторизація до WebSocket; збірка Docker-образів у CI; довші оновлення |
| HACS «Dashboard»-плагін лише з картками + окрема панель | — | два репо/дві версії, ручні ресурси Lovelace |

## Потік даних

```
                 ┌──────────────── packages/ha-data ──────────────────────┐
                 │ HassLike { states, callService, callWS, themes, user } │
   production →  │  panel source  ← HA ставить element.hass               │
   pnpm dev   →  │  mock source   ← fixtures + scenarios                  │
   dev:live   →  │  live source   ← home-assistant-js-websocket+token     │
                 │ domain.ts + navigation.ts (чисті тестовані функції)    │
                 └───────────┬───────────────────────────────┬────────────┘
                     React hooks (useEntity…)        Lit cards (hass prop)
                       apps/panel                       packages/cards
```

UI-код ніколи не знає, звідки дані: однаковий контракт `hass` для моків, живого HA і production.

## Панель і навігація (Варіант 3)
- Custom element `<hsu-panel>` (`apps/panel/src/panel-element.tsx`), реєструється з `embed_iframe: true` → власний документ: Tailwind, портали Base UI (select, dialog, sheet, tooltip) і `.dark` працюють як на звичайній сторінці, стилі HA не протікають.
- **AppShell** (`apps/panel/src/components/nav/AppShell.tsx`):
  - **Десктоп:** власний згортаний shadcn-сайдбар із групами (*Головне*: Дім, Інвертор Deye `/lovelace/deye`, Зарядка Eveus `/lovelace/eveus`; *Аналітика*; *Система* з бейджем оновлень) та футером (сповіщення, перемикач теми, «Налаштувати меню», профіль).
  - **Мобільний:** верхній липкий бар, нижня фіксована панель вкладок (*Дім · Deye · Eveus · Меню*) та висувний shadcn `Sheet`-drawer.
  - **Редактор меню** (`MenuEditorDialog.tsx`): вмикання/вимикання, сортування, власні посилання HA; зберігається через HA WebSocket `frontend/set_user_data` (`key: "hsu_nav"`) для синхронізації між пристроями + кеш у `localStorage`.
  - **Міст до HA** (`ha-bridge.ts`): SPA-переходи батьківського вікна через офіційний `window.parent.customPanel.navigate(path)` (фолбек — `pushState` + `location-changed`), відкриття сповіщень (`hass-show-notifications`) та миттєве перемикання теми (`settheme`).
- Темна тема береться з `hass.themes.darkMode` (тобто з налаштувань профілю HA).
- Production-бандл: `panel.js` (~546 KB / ~168 KB gzip) + шрифти Inter як окремі файли (браузер тягне лише потрібні субсети).

## Картки
- Lovelace-картки живуть у shadow DOM, тому замість Tailwind-класів — звичайний CSS поверх тих самих CSS-змінних (`@hsu/tokens/theme.css`). shadcn-вигляд, але без конфлікту з shadow DOM.
- `shouldUpdate` перерендерює картку лише коли змінились її сутності.
- Реєструються в `window.customCards` → видно в пікері карток.

## Токени → три виходи
`packages/tokens/tokens.json` → `packages/tokens/theme.css` (панель + картки), `themes/shadcn_ui.yaml` (стандартні екрани HA + змінні `--hsu-*`) і `themes/custom-sidebar/custom-sidebar-config.yaml` (стиль drawer-меню HA через `elchininet/custom-sidebar`, `sidebar_mode: "hidden"` без подвійного сайдбару на `/home-ui` та `default_path: "/home-ui"` з `default_path_allowlist`). CI падає, якщо згенеровані файли не відповідають токенам.
