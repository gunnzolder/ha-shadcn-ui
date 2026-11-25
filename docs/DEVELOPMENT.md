# Розробка

## 1. Чотири рівні дебагу — від найшвидшого до найчеснішого

| Рівень | Команда | Дані | Де дивитись | Коли |
|---|---|---|---|---|
| **Моки** | `pnpm dev` / `pnpm dev:cards` | фікстура + сценарії | `localhost:5173`, `localhost:5174/dev/` | 90% часу: верстка, стани, edge cases |
| **Живий HA ззовні** | `pnpm dev:live` | ваш HA через WebSocket + токен | `localhost:5173` | перевірити на реальних даних, клікати реальні перемикачі |
| **HMR всередині HA** | `pnpm dev:ha` | справжній `hass` від HA | сайдбар HA «Дім (dev)» | інтеграційні речі: iframe, тема HA, мобільний застосунок |
| **Збірка в HA** | `pnpm deploy:ha` або пре-реліз | справжній `hass` | HA | фінальна перевірка гілки перед мержем |

### Моки
- Фікстура: `packages/ha-data/fixtures/default_view.json` — знімок `lovelace/default_view` (конфіг + стани 14 сутностей, без `entity_picture`/токенів).
- Оновити з HA: заповнити `.env.local` (див. `.env.example`) → `pnpm snapshot`. Інші view: `pnpm snapshot --views default_view,foo --out foo`.
- **Сценарії** (`packages/ha-data/src/scenarios.ts`): `normal`, `outage`, `low-battery`, `phase-loss`, `fault`, `inverter-offline`, `tomorrow-published`, `everything-unavailable`. Перемикач у dev-тулбарі або `?scenario=outage`, темна тема `?dark=1`.
- Мок реалізує `callService` для `switch/light/input_boolean/fan/media_player` (turn_on/off/toggle) і логує виклики в консоль; вольтаж «дихає» кожні 3 с.
- Новий edge case = новий сценарій + тест у `domain.test.ts`.

### Живий HA ззовні (`pnpm dev:live`)
`.env.local`: `HA_URL=http://homeassistant.local:8123`, `HA_TOKEN=<long-lived token>` (Профіль → Безпека).
Токен потрапляє лише в dev-сервер, у production-збірку — ні (`vite.config.ts` → `define`). `?source=mock` / `?source=live` перемикає на льоту.

### HMR всередині HA (`pnpm dev:ha`)
1. `.env.local`: `DEV_HOST=<ім'я вашого Mac у мережі>` (напр. `antons-m4-air.local`).
2. `pnpm dev:ha` — піднімає панель (:5173) і картки (:5174), доступні з LAN.
3. HA → *Settings → Devices & services → shadcn UI → Configure*:
   - **Panel dev URL** = `http://<DEV_HOST>:5173/src/dev-entry.ts`
   - **Cards dev URL** = `http://<DEV_HOST>:5174/src/index.ts`
4. У сайдбарі «Дім (dev)» — ваш локальний код з hot reload і справжнім `hass`. Картки на дашбордах теж з dev-сервера (оновіть сторінку).
5. Закінчили — очистіть обидва поля, повернеться зібрана версія.

Працює по HTTP у локальній мережі (`homeassistant.local:8123`). Через HTTPS/Nabu Casa браузер заблокує http-скрипти — для цього є пре-релізи.

### Збірка гілки в HA без релізу (`pnpm deploy:ha`)
Збирає, копіює `custom_components/shadcn_ui` у HA (Samba add-on → `/Volumes/config`, або SSH add-on → `root@homeassistant.local:/config`) і перезавантажує інтеграцію через REST. Версія штампується як `0.0.0-dev.<branch>.<sha>`.
`pnpm deploy:ha --restart` — якщо змінювався Python.

## 2. Гілки й пайплайн

```
feature/xyz ──PR──▶ main ──release-please PR──▶ tag vX.Y.Z ──▶ GitHub Release + shadcn_ui.zip ──▶ HACS update у HA
     │
     └─ (опційно) Actions → «Pre-release from branch»  або push у beta/xyz
          ──▶ pre-release vX.Y.Z-feature-xyz.N ──▶ HACS «Show beta versions» → Redownload → вибрати версію
```

- **Trunk-based**: `main` захищена, все через PR. Назви PR/комітів — *conventional commits* (`feat:`, `fix:`, `chore:`): з них release-please рахує версію і changelog.
- **CI на кожен PR** (`ci.yml`): токени актуальні · typecheck · vitest (дані + картки) · збірка · pytest проти HA core · hassfest · HACS validation. Готовий `shadcn_ui.zip` лежить в артефактах запуску.
- **Реліз** (`release.yml`): release-please тримає відкритий PR «release vX.Y.Z»; мерж = тег + реліз + zip. HACS показує оновлення.
- **Пре-реліз з гілки** (`prerelease.yml`): ручний запуск на будь-якій гілці або автоматично на `beta/**`. При видаленні гілки її пре-релізи прибираються (`cleanup-prereleases.yml`).
- `www/` (збірка) не комітиться — її робить CI і кладе в zip (`hacs.json` → `zip_release`, `hide_default_branch`).

### Рекомендовані налаштування GitHub
- Branch protection на `main`: required checks = `Frontend`, `Integration`, `hassfest`, `HACS validation`; squash merge; PR title = commit message.
- Settings → Actions → General → Workflow permissions: *Read and write* + *Allow GitHub Actions to create and approve pull requests* (для release-please).

## 3. Як додавати

- **shadcn-компонент**: `cd apps/panel && npx shadcn add <name>`. ReUI / інші реєстри — через `registries` у `apps/panel/components.json`.
- **Нова картка**: `packages/cards/src/<name>-card.ts` (наслідувати `HsuBaseCard`), імпорт у `src/index.ts`, додати в `dev/main.ts`, тест у `cards.test.ts`. Логіку станів — у `packages/ha-data/src/domain.ts`, щоб панель і картка поводились однаково.
- **Кольори/радіуси**: тільки `packages/tokens/tokens.json` (можна вставити значення з tweakcn) → `pnpm theme`. Оновляться і панель, і картки, і YAML-тема.
