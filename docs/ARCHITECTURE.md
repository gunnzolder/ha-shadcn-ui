# Архітектура

## Чому одна custom integration, а не add-on чи окремі HACS-плагіни

| Варіант | + | − |
|---|---|---|
| **Custom integration (обрано)** | одна установка/оновлення через HACS; панель отримує `hass` від HA напряму (без токенів і окремої авторизації); картки підвантажуються автоматично (`add_extra_js_url`); працює на будь-якому типі встановлення HA | Python-частина потребує рестарту HA при змінах (фронтенд — ні) |
| Add-on (Ingress) | повна свобода, свій сервер | тільки HAOS/Supervised; окрема авторизація до WebSocket; збірка Docker-образів у CI; довші оновлення |
| HACS «Dashboard»-плагін лише з картками + окрема панель | — | два репо/дві версії, ручні ресурси Lovelace |

## Потік даних

```
                 ┌──────────────── packages/ha-data ────────────────┐
                 │ HassLike { states, callService, themes, language } │
   production →  │  panel source  ← HA ставить element.hass           │
   pnpm dev   →  │  mock source   ← fixtures + scenarios              │
   dev:live   →  │  live source   ← home-assistant-js-websocket+token │
                 │ domain.ts: deriveGrid / deriveOutage (чисті функції)│
                 └───────────┬───────────────────────────┬────────────┘
                     React hooks (useEntity…)      Lit cards (hass prop)
                       apps/panel                     packages/cards
```

UI-код ніколи не знає, звідки дані: однаковий контракт `hass` для моків, живого HA і production.

## Панель
- Custom element `<hsu-panel>` (`apps/panel/src/panel-element.tsx`), реєструється з `embed_iframe: true` → власний документ: Tailwind, портали Base UI (select, dialog, popover) і `.dark` працюють як на звичайній сторінці, стилі HA не протікають.
- Темна тема береться з `hass.themes.darkMode` (тобто з налаштувань профілю HA).
- Production-бандл: `panel.js` (~350 KB / ~107 KB gzip) + шрифти Inter як окремі файли (браузер тягне лише потрібні субсети).

## Картки
- Lovelace-картки живуть у shadow DOM, тому замість Tailwind-класів — звичайний CSS поверх тих самих CSS-змінних (`@hsu/tokens/theme.css`). shadcn-вигляд, але без конфлікту з shadow DOM.
- `shouldUpdate` перерендерює картку лише коли змінились її сутності.
- Реєструються в `window.customCards` → видно в пікері карток.

## Токени → три виходи
`packages/tokens/tokens.json` → `packages/tokens/theme.css` (панель + картки), `themes/shadcn_ui.yaml` (стандартні екрани HA + змінні `--hsu-*`) і `themes/custom-sidebar/custom-sidebar-config.yaml` (shadcn-вигляд головного меню HA через `elchininet/custom-sidebar`). CI падає, якщо згенеровані файли не відповідають токенам.
