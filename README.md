# pwa-lib

Zero-config CLI-библиотека для полного управления PWA.

Установил пакет, запустил `pwa-lib generate` — получил готовые иконки всех размеров, `manifest.json` и `sw.js` с кэшированием. Конфиг нужен только если хочешь что-то изменить.

## Что умеет

- **Генерация иконок** — из одного PNG (>= 512x512) создаёт 12 стандартных размеров, maskable-иконку с safe zone, `favicon.ico` с тремя размерами внутри. Всего 14 файлов. Использует `sharp` — нативный и быстрый.
- **Генерация manifest.json** — полный веб-манифест с иконками, цветами, display mode, orientation, scope. Автоматически берёт `name` и `description` из `package.json`.
- **Генерация Service Worker** — готовый `sw.js` с 5 стратегиями кэширования, роутингом по URL-паттернам, precache, push-уведомлениями, управлением жизненным циклом. Без Workbox, без runtime-зависимостей.
- **Push-уведомления** — в SW генерируется обработчик `push` и `notificationclick`. На клиенте — `createPushClient()` делает всё за один вызов: подписка, VAPID, отправка на сервер. Конфиг подтягивается из `pwa.config.ts` автоматически.
- **Watch mode** — `pwa-lib dev` следит за конфигом и `public/`, перегенерирует SW при изменениях.
- **Клиентская библиотека** — `pwa-lib/client` экспортирует `registerSW()` и `notifications` API. Pure ESM, zero dependencies, tree-shakeable.
- **TypeScript** — полная типизация конфига, клиентского API и всех экспортов. `defineConfig()` даёт автокомплит в IDE.
- **Автодетект** — иконка находится автоматически по 10 стандартным путям. `name`/`description` берутся из `package.json`. Дефолтные стратегии кэширования покрывают типичные сценарии.

## Установка

```bash
npm install pwa-lib
```

## Быстрый старт

```bash
# Вариант 1: всё на дефолтах, без конфига
npx pwa-lib generate

# Вариант 2: создать конфиг, настроить, сгенерировать
npx pwa-lib init
# отредактировать pwa.config.ts
npx pwa-lib generate
```

Результат:
```
public/
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   ├── icon-512.png
│   ├── icon-512-maskable.png
│   ├── apple-touch-icon.png
│   └── favicon.ico
├── manifest.json
├── sw.js
└── pwa-push.json          # если настроены serverUrl/appId/apiKey
```

---

## Конфигурация

### Философия

**Без конфига работает всё.** Конфиг нужен только когда хочешь изменить дефолтное поведение. Каждое поле опционально. Можно указать только то, что отличается от дефолтов — остальное подставится автоматически.

### Создание конфига

```bash
pwa-lib init
```

Создаёт `pwa.config.ts` с закомментированными примерами. Или создай файл вручную.

### Форматы конфига

CLI ищет конфиг в таком порядке:

1. `pwa.config.ts` — TypeScript (рекомендуется, даёт автокомплит)
2. `pwa.config.js` — ESM JavaScript
3. `pwa.config.mjs` — ESM JavaScript (явный)

TypeScript-конфиги загружаются через [jiti](https://github.com/unjs/jiti) — не нужен `ts-node`, `tsx` или другой рантайм. Просто пиши `.ts`.

### Типизированный конфиг

Для полного автокомплита в IDE используй `defineConfig()`:

```ts
import { defineConfig } from 'pwa-lib/config'

export default defineConfig({
  // автокомплит работает здесь
})
```

Или без импорта (работает без установленного пакета, например сразу после `pwa-lib init`):

```ts
/** @type {import('pwa-lib').PwaConfig} */
export default {
  // конфиг
}
```

### Приоритет значений

Конфиг мержится через `defu` (глубокий merge). Приоритет:

1. **Твой `pwa.config.ts`** — наивысший приоритет
2. **`package.json`** — `name` и `description` подставляются в `manifest.name`, `manifest.short_name`, `manifest.description`
3. **Встроенные дефолты** — всё остальное

Это значит: если в `package.json` написано `"name": "my-app"`, то `manifest.name` будет `"my-app"` без какого-либо конфига. Но если в `pwa.config.ts` указать `manifest.name` — оно перебьёт значение из `package.json`.

### Полный конфиг со всеми опциями

```ts
import { defineConfig } from 'pwa-lib/config'

export default defineConfig({
  // ─── Иконка ────────────────────────────────────────────
  // Путь к исходному изображению для генерации всех размеров.
  // Требования: PNG, минимум 512x512.
  // Если не указан — автопоиск (см. ниже).
  icon: './src/assets/icon.png',

  // ─── Manifest ──────────────────────────────────────────
  // Все поля Web App Manifest.
  // name и description берутся из package.json если не указаны.
  manifest: {
    // Полное имя приложения. Показывается при установке, в списке приложений.
    // Дефолт: package.json → name, или 'My PWA'
    name: 'My Awesome App',

    // Короткое имя. Показывается под иконкой на рабочем столе.
    // Рекомендуется <= 12 символов.
    // Дефолт: package.json → name, или 'PWA'
    short_name: 'App',

    // Описание приложения. Показывается в магазинах приложений.
    // Дефолт: package.json → description, или ''
    description: 'The best progressive web app',

    // Цвет темы. Влияет на цвет адресной строки и системного UI.
    // Дефолт: '#ffffff'
    theme_color: '#4285f4',

    // Цвет фона splash screen при запуске.
    // Дефолт: '#ffffff'
    background_color: '#ffffff',

    // Режим отображения:
    // - 'standalone' — как нативное приложение, без браузерного UI (рекомендуется)
    // - 'fullscreen' — на весь экран, без status bar
    // - 'minimal-ui' — с минимальной навигацией браузера
    // - 'browser' — обычная вкладка браузера
    // Дефолт: 'standalone'
    display: 'standalone',

    // URL, который открывается при запуске приложения.
    // Дефолт: '/'
    start_url: '/',

    // Scope ограничивает навигацию приложения. URL за пределами scope
    // открываются в обычном браузере.
    // Дефолт: '/'
    scope: '/',

    // Язык приложения (BCP 47 tag).
    // Дефолт: 'en'
    lang: 'ru',

    // Предпочтительная ориентация экрана:
    // - 'any' — любая
    // - 'natural' — по умолчанию для устройства
    // - 'landscape' — горизонтальная
    // - 'portrait' — вертикальная
    // Дефолт: 'any'
    orientation: 'portrait',
  },

  // ─── Service Worker ────────────────────────────────────
  sw: {
    // Куда записать сгенерированный sw.js.
    // Дефолт: './public/sw.js'
    output: './public/sw.js',

    // Glob-паттерны файлов для precache (предзагрузка при установке SW).
    // Все совпавшие файлы будут закэшированы при первом визите.
    // Дефолт: [] (ничего не предзагружается)
    precache: [
      './public/**/*.html',
      './public/**/*.css',
      './public/**/*.js',
    ],

    // Стратегии кэширования по маршрутам.
    // Порядок имеет значение — первый совпавший маршрут выигрывает.
    // Дефолт: см. "Дефолтные маршруты" ниже.
    routes: [
      // API-запросы: сначала сеть, при ошибке — кэш
      {
        match: '/api/**',
        strategy: 'NetworkFirst',
        cache: 'api-cache',
        maxAge: 60 * 5,         // 5 минут
      },

      // Картинки: сначала кэш, подгрузка из сети при промахе
      {
        match: '*.{png,jpg,jpeg,gif,svg,webp,ico}',
        strategy: 'CacheFirst',
        cache: 'images',
        maxAge: 60 * 60 * 24 * 30,  // 30 дней
        maxEntries: 100,             // максимум 100 картинок в кэше
      },

      // Шрифты: долгий кэш, редко меняются
      {
        match: '*.{woff,woff2,ttf,eot}',
        strategy: 'CacheFirst',
        cache: 'fonts',
        maxAge: 60 * 60 * 24 * 365, // 1 год
      },

      // Страницы авторизации: никогда не кэшировать
      {
        match: '/auth/**',
        strategy: 'NetworkOnly',
      },

      // Всё остальное: отдать кэш сразу, обновить в фоне
      {
        match: '/**',
        strategy: 'StaleWhileRevalidate',
      },
    ],
  },

  // ─── Push-уведомления ──────────────────────────────────
  // Настройки push-уведомлений в сгенерированном SW.
  // serverUrl, appId, apiKey записываются в public/pwa-push.json при generate —
  // createPushClient() подтягивает их автоматически.
  notifications: {
    // Включить обработчики push/notificationclick в SW.
    // Если false — push-код не генерируется.
    // Дефолт: true
    enabled: true,

    // Иконка уведомления по умолчанию (если не передана в push payload).
    // Дефолт: '/icons/icon-192.png'
    defaultIcon: '/icons/icon-192.png',

    // Badge — маленькая иконка в status bar (Android).
    // Дефолт: '/icons/badge-72.png'
    badge: '/icons/badge-72.png',

    // VAPID public key для подписки на push-уведомления.
    // Если указан — createPushClient() использует его напрямую,
    // без запроса к серверу GET /apps/:appId/vapid-key.
    // Дефолт: '' (запрашивается с сервера)
    vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkGs-GDq...',

    // URL push-сервера. Подтягивается в createPushClient() автоматически.
    serverUrl: 'https://push.example.com',

    // Идентификатор приложения на push-сервере.
    appId: 'my-app',

    // API-ключ для аутентификации на push-сервере.
    apiKey: 'your-api-key',
  },

  // ─── Выходная директория ───────────────────────────────
  // Куда складывать сгенерированные иконки.
  // Дефолт: './public/icons'
  outDir: './public/icons',
})
```

---

### Конфиг: `icon`

```ts
{ icon: './src/assets/logo.png' }
```

Путь к исходному изображению. Требования:
- Формат: PNG (рекомендуется), JPEG, WebP, TIFF, GIF, SVG
- Минимальный размер: 512x512 пикселей
- Рекомендуется: квадратное изображение 1024x1024 для лучшего качества

Если не указан, запускается автопоиск по 10 стандартным путям:

| Приоритет | Путь |
|-----------|------|
| 1 | `icon.png` |
| 2 | `logo.png` |
| 3 | `favicon.png` |
| 4 | `app-icon.png` |
| 5 | `src/assets/icon.png` |
| 6 | `src/assets/logo.png` |
| 7 | `assets/icon.png` |
| 8 | `assets/logo.png` |
| 9 | `public/icon.png` |
| 10 | `public/logo.png` |

Первый найденный файл используется. Если ничего не найдено — генерация иконок пропускается с предупреждением, остальное (manifest, SW) генерируется.

---

### Конфиг: `manifest`

Управляет содержимым `manifest.json`. Каждое поле опционально.

#### `manifest.name`

```ts
{ manifest: { name: 'My App' } }
```

Полное имя приложения. Показывается:
- В диалоге установки PWA
- В списке приложений ОС
- В App Switcher

**Дефолт:** значение `name` из `package.json`, или `'My PWA'`.

#### `manifest.short_name`

```ts
{ manifest: { short_name: 'App' } }
```

Короткое имя. Показывается:
- Под иконкой на рабочем столе
- В Dock / Taskbar

Рекомендуется не более 12 символов — длинные имена обрезаются.

**Дефолт:** значение `name` из `package.json`, или `'PWA'`.

#### `manifest.description`

```ts
{ manifest: { description: 'Fast and reliable task manager' } }
```

Описание приложения. Используется при публикации в магазины (Google Play через TWA, Microsoft Store).

**Дефолт:** значение `description` из `package.json`, или `''`.

#### `manifest.theme_color`

```ts
{ manifest: { theme_color: '#4285f4' } }
```

Цвет темы. Влияет на:
- Цвет адресной строки в Chrome Android
- Цвет Title Bar в десктопном PWA
- Цвет системного UI при переключении приложений

**Дефолт:** `'#ffffff'`

#### `manifest.background_color`

```ts
{ manifest: { background_color: '#f5f5f5' } }
```

Цвет фона splash screen, который показывается при запуске PWA до загрузки первой страницы. Рекомендуется совпадать с фоном приложения для плавного перехода.

**Дефолт:** `'#ffffff'`

#### `manifest.display`

```ts
{ manifest: { display: 'standalone' } }
```

Режим отображения. Определяет, сколько браузерного UI видно пользователю:

| Значение | Описание |
|----------|----------|
| `'standalone'` | Как нативное приложение. Без адресной строки, без табов. Есть status bar. **Рекомендуется.** |
| `'fullscreen'` | Весь экран. Без status bar. Подходит для игр и медиа. |
| `'minimal-ui'` | Минимальная навигация браузера (назад/вперёд). |
| `'browser'` | Обычная вкладка. Не имеет смысла для PWA, но валидное значение. |

**Дефолт:** `'standalone'`

#### `manifest.start_url`

```ts
{ manifest: { start_url: '/app' } }
```

URL, который открывается при запуске PWA с рабочего стола. Можно добавить query-параметры для трекинга: `'/app?source=pwa'`.

**Дефолт:** `'/'`

#### `manifest.scope`

```ts
{ manifest: { scope: '/app/' } }
```

Ограничивает навигацию внутри PWA. Если пользователь переходит по ссылке за пределами scope — открывается обычный браузер. Например, `scope: '/app/'` означает, что `/app/settings` работает внутри PWA, а `/blog` откроется в браузере.

**Дефолт:** `'/'`

#### `manifest.lang`

```ts
{ manifest: { lang: 'ru' } }
```

Основной язык приложения. BCP 47 тег (`'en'`, `'ru'`, `'de'`, `'ja'`, `'zh-CN'` и т.д.).

**Дефолт:** `'en'`

#### `manifest.orientation`

```ts
{ manifest: { orientation: 'portrait' } }
```

Предпочтительная ориентация экрана:

| Значение | Описание |
|----------|----------|
| `'any'` | Любая ориентация. Приложение подстраивается. |
| `'natural'` | Естественная ориентация устройства (портрет для телефона, ландшафт для планшета). |
| `'landscape'` | Горизонтальная. |
| `'portrait'` | Вертикальная. |

**Дефолт:** `'any'`

---

### Конфиг: `sw`

Управляет генерацией Service Worker.

#### `sw.output`

```ts
{ sw: { output: './dist/sw.js' } }
```

Путь, куда записать сгенерированный `sw.js`. Директории создаются автоматически.

**Дефолт:** `'./public/sw.js'`

#### `sw.precache`

```ts
{ sw: { precache: ['./public/**/*.{html,css,js}'] } }
```

Glob-паттерны файлов для предварительного кэширования. Все совпавшие файлы будут загружены и закэшированы при установке Service Worker — ещё до того, как пользователь откроет эти страницы.

Когда использовать:
- App shell (HTML, CSS, JS)
- Критичные ресурсы для offline-работы
- Страницы, которые должны открываться мгновенно

Когда НЕ использовать:
- Большие файлы (видео, архивы) — замедлят установку SW
- Часто меняющийся контент — придётся обновлять SW при каждом изменении

Примеры паттернов:
```ts
precache: [
  './public/index.html',                   // конкретный файл
  './public/**/*.css',                      // все CSS
  './public/assets/**/*.{js,css}',          // JS и CSS из assets
  './public/**/*.{html,css,js,json}',       // все основные ресурсы
]
```

Файлы преобразуются в URL-пути (`./public/assets/main.css` → `/assets/main.css`).

**Дефолт:** `[]` (ничего не предзагружается)

#### `sw.routes`

```ts
{ sw: { routes: [{ match: '...', strategy: '...', ... }] } }
```

Массив правил кэширования. Каждый запрос проверяется по порядку — первое совпадение выигрывает.

Параметры каждого маршрута:

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `match` | `string` | да | URL-паттерн |
| `strategy` | `CacheStrategy` | да | Стратегия кэширования |
| `cache` | `string` | нет | Имя кэша (автогенерируется если не указано) |
| `maxAge` | `number` | нет | TTL в секундах |
| `maxEntries` | `number` | нет | Максимум записей в кэше |

**Синтаксис `match`:**

| Паттерн | Значение | Пример совпадения |
|---------|----------|-------------------|
| `/api/**` | Любой путь начинающийся с `/api/` | `/api/users`, `/api/v2/posts/123` |
| `*.{png,jpg}` | Файлы с расширениями `.png` или `.jpg` | `/images/photo.png`, `/logo.jpg` |
| `/fonts/**` | Все шрифты в `/fonts/` | `/fonts/Inter.woff2` |
| `/**` | Абсолютно любой путь (catch-all) | Всё |
| `*` | Любой сегмент (без `/`) | Один уровень пути |
| `**` | Любое количество сегментов | Любая вложенность |

**Стратегии (`strategy`):**

| Стратегия | Поведение | Лучше всего для |
|-----------|-----------|-----------------|
| `'CacheFirst'` | Кэш → сеть (при промахе или истечении) | Статика: картинки, шрифты, CSS/JS |
| `'NetworkFirst'` | Сеть (3с таймаут) → кэш | API, динамический контент |
| `'StaleWhileRevalidate'` | Кэш сразу + обновление в фоне | Страницы, JSON-данные |
| `'NetworkOnly'` | Только сеть, без кэширования | Авторизация, платежи, аналитика |
| `'CacheOnly'` | Только кэш, без сети | Предзагруженные ресурсы |

**`maxAge`** — время жизни кэша в секундах. После истечения запись считается устаревшей. Удобные значения:

| Время | Секунды | Выражение |
|-------|---------|-----------|
| 5 минут | 300 | `60 * 5` |
| 1 час | 3600 | `60 * 60` |
| 1 день | 86400 | `60 * 60 * 24` |
| 7 дней | 604800 | `60 * 60 * 24 * 7` |
| 30 дней | 2592000 | `60 * 60 * 24 * 30` |
| 1 год | 31536000 | `60 * 60 * 24 * 365` |

**`maxEntries`** — максимальное количество записей в кэше. При превышении удаляются самые старые. Защищает от переполнения хранилища.

**`cache`** — имя кэша в Cache Storage браузера. Если не указано, генерируется автоматически из стратегии (например, `rt-networkfirst`). Рекомендуется указывать для удобства отладки в DevTools.

#### Дефолтные маршруты

Если `sw.routes` не указаны, используются:

| Паттерн | Стратегия | Кэш | TTL | Лимит |
|---------|-----------|-----|-----|-------|
| `/api/**` | NetworkFirst | `api-cache` | 5 мин | — |
| `*.{png,jpg,jpeg,gif,svg,webp,ico}` | CacheFirst | `images` | 30 дней | 100 |
| `*.{woff,woff2,ttf,eot}` | CacheFirst | `fonts` | 1 год | — |
| `/**` | StaleWhileRevalidate | — | — | — |

Этот набор покрывает типичное SPA/MPA: API через сеть с fallback, статика из кэша, остальное — stale-while-revalidate.

#### Порядок маршрутов

Порядок массива `routes` имеет значение. Первый совпавший паттерн обрабатывает запрос. Общие паттерны (`/**`) должны быть в конце:

```ts
routes: [
  { match: '/api/**', strategy: 'NetworkFirst', ... },     // 1. конкретное
  { match: '*.{png,jpg}', strategy: 'CacheFirst', ... },   // 2. по расширению
  { match: '/**', strategy: 'StaleWhileRevalidate' },      // 3. catch-all в конце
]
```

Если поставить `/**` первым — все запросы будут обработаны StaleWhileRevalidate, и до остальных правил дело не дойдёт.

---

### Конфиг: `notifications`

Настройки push-уведомлений в сгенерированном Service Worker. Можно полностью отключить push-обработчики или настроить иконки-fallback. Также содержит параметры подключения к push-серверу (`serverUrl`, `appId`, `apiKey`) — при `pwa-lib generate` они записываются в `public/pwa-push.json`, и `createPushClient()` подтягивает их автоматически.

#### `notifications.enabled`

```ts
{ notifications: { enabled: false } }
```

Включает или отключает обработчики `push` и `notificationclick` в сгенерированном SW. Если `false` — push-код не попадает в SW.

**Дефолт:** `true`

#### `notifications.defaultIcon`

```ts
{ notifications: { defaultIcon: '/icons/icon-192.png' } }
```

Иконка уведомления. Показывается рядом с текстом в панели уведомлений и в развёрнутом виде.

**Дефолт:** `'/icons/icon-192.png'`

#### `notifications.badge`

```ts
{ notifications: { badge: '/icons/badge-72.png' } }
```

Badge — маленькая монохромная иконка в status bar Android. Показывается, когда уведомление свёрнуто. Рекомендуется квадратная, 72x72 или 96x96, с прозрачным фоном.

**Дефолт:** `'/icons/badge-72.png'`

#### `notifications.vapidPublicKey`

```ts
{ notifications: { vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkGs-GDq...' } }
```

VAPID public key для подписки на push-уведомления. Если указан, `createPushClient()` использует его напрямую — без запроса `GET /apps/:appId/vapid-key` к серверу. Это убирает лишний сетевой запрос при подписке.

**Дефолт:** `''` (ключ запрашивается с сервера)

#### `notifications.serverUrl`

```ts
{ notifications: { serverUrl: 'https://push.example.com' } }
```

URL push-сервера. При `pwa-lib generate` записывается в `public/pwa-push.json` и автоматически подтягивается в `createPushClient()`.

**Дефолт:** `''`

#### `notifications.appId`

```ts
{ notifications: { appId: 'my-app' } }
```

Идентификатор приложения на push-сервере. При `pwa-lib generate` записывается в `public/pwa-push.json` и автоматически подтягивается в `createPushClient()`.

**Дефолт:** `''`

#### `notifications.apiKey`

```ts
{ notifications: { apiKey: 'your-api-key' } }
```

API-ключ для аутентификации на push-сервере. При `pwa-lib generate` записывается в `public/pwa-push.json` и автоматически подтягивается в `createPushClient()`.

**Дефолт:** `''`

---

### Конфиг: `outDir`

```ts
{ outDir: './public/icons' }
```

Директория для сгенерированных иконок. Создаётся автоматически. URL-пути в `manifest.json` строятся относительно `public/` (то есть `./public/icons` → `/icons/icon-192.png` в манифесте).

**Дефолт:** `'./public/icons'`

---

### Примеры конфигов

#### Минимальный

Просто указать иконку, остальное на дефолтах:

```ts
export default {
  icon: './logo.png',
}
```

#### Только manifest

Настроить внешний вид PWA, всё остальное по умолчанию:

```ts
import { defineConfig } from 'pwa-lib/config'

export default defineConfig({
  manifest: {
    name: 'Task Manager',
    short_name: 'Tasks',
    theme_color: '#1a73e8',
    background_color: '#fafafa',
    lang: 'ru',
  },
})
```

#### Кастомные стратегии кэширования

Для приложения с GraphQL API и CDN:

```ts
import { defineConfig } from 'pwa-lib/config'

export default defineConfig({
  sw: {
    routes: [
      // GraphQL — всегда сеть
      {
        match: '/graphql',
        strategy: 'NetworkOnly',
      },
      // CDN-картинки — долгий кэш
      {
        match: '*.{png,jpg,jpeg,webp,avif}',
        strategy: 'CacheFirst',
        cache: 'cdn-images',
        maxAge: 60 * 60 * 24 * 90,  // 90 дней
        maxEntries: 200,
      },
      // HTML-страницы — быстро из кэша, обновление в фоне
      {
        match: '*.html',
        strategy: 'StaleWhileRevalidate',
        cache: 'pages',
      },
      // Остальное
      {
        match: '/**',
        strategy: 'NetworkFirst',
        cache: 'default',
        maxAge: 60 * 60,
      },
    ],
  },
})
```

#### Offline-first приложение

Precache app shell для полной offline-работы:

```ts
import { defineConfig } from 'pwa-lib/config'

export default defineConfig({
  icon: './src/assets/app-icon.png',
  manifest: {
    name: 'Offline Notes',
    short_name: 'Notes',
    display: 'standalone',
    theme_color: '#212121',
    background_color: '#212121',
  },
  sw: {
    precache: [
      './public/index.html',
      './public/assets/**/*.{js,css}',
      './public/fonts/**/*.woff2',
    ],
    routes: [
      { match: '/api/**', strategy: 'NetworkFirst', cache: 'api', maxAge: 60 * 10 },
      { match: '/**', strategy: 'CacheFirst', cache: 'app-shell' },
    ],
  },
})
```

#### Полный конфиг

Все опции явно:

```ts
import { defineConfig } from 'pwa-lib/config'

export default defineConfig({
  icon: './src/assets/icon-1024.png',
  outDir: './public/icons',
  manifest: {
    name: 'My Production App',
    short_name: 'MyApp',
    description: 'A production-ready progressive web application',
    theme_color: '#4285f4',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/?source=pwa',
    scope: '/',
    lang: 'en',
    orientation: 'portrait',
  },
  sw: {
    output: './public/sw.js',
    precache: ['./public/**/*.{html,css,js}'],
    routes: [
      { match: '/auth/**', strategy: 'NetworkOnly' },
      { match: '/api/**', strategy: 'NetworkFirst', cache: 'api', maxAge: 300 },
      { match: '*.{png,jpg,jpeg,gif,svg,webp}', strategy: 'CacheFirst', cache: 'images', maxAge: 2592000, maxEntries: 100 },
      { match: '*.{woff,woff2}', strategy: 'CacheFirst', cache: 'fonts', maxAge: 31536000 },
      { match: '*.{js,css}', strategy: 'StaleWhileRevalidate', cache: 'static', maxEntries: 50 },
      { match: '/**', strategy: 'NetworkFirst', cache: 'pages', maxAge: 86400 },
    ],
  },
  notifications: {
    defaultIcon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vapidPublicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkGs-GDq...',
    serverUrl: 'https://push.example.com',
    appId: 'my-app',
    apiKey: 'your-api-key',
  },
})
```

---

## CLI-команды

### `pwa-lib init`

Создаёт `pwa.config.ts` с закомментированными примерами.

```bash
pwa-lib init          # создать конфиг
pwa-lib init --yes    # без вопросов, сразу дефолты
```

| Флаг | Алиас | Описание |
|------|-------|----------|
| `--yes` | `-y` | Пропустить вопросы |

Если `pwa.config.ts` уже существует — пропускает с предупреждением.

### `pwa-lib generate`

Основная команда. Генерирует всё разом: иконки + manifest + Service Worker + push-конфиг.

```bash
pwa-lib generate
```

Читает `pwa.config.ts` (или дефолты если конфига нет). Если иконка не найдена — генерация иконок пропускается, остальное генерируется. Если заданы `notifications.serverUrl` / `appId` / `apiKey` — дополнительно генерирует `public/pwa-push.json` для автоматической конфигурации `createPushClient()`.

### `pwa-lib icons`

Генерация только иконок.

```bash
pwa-lib icons
pwa-lib icons --input ./logo.png
pwa-lib icons --input ./logo.png --output ./public/icons
```

| Флаг | Алиас | Описание |
|------|-------|----------|
| `--input` | `-i` | Путь к исходной иконке (>= 512x512) |
| `--output` | `-o` | Директория для иконок |

Если флаги не указаны — берёт значения из конфига / автодетекта.

### `pwa-lib dev`

Watch mode. Следит за конфигом и `public/`, перегенерирует SW и `pwa-push.json` при изменениях.

```bash
pwa-lib dev
```

Следит за:
- `pwa.config.ts` / `pwa.config.js` / `pwa.config.mjs`
- `public/` (рекурсивно)

Дебаунс: 300мс для конфига, 500мс для `public/`.

---

## Генерация иконок

Из одного изображения (>= 512x512) генерируются:

| Размер | Файл | Назначение |
|--------|------|------------|
| 16x16 | `icon-16.png` | favicon |
| 32x32 | `icon-32.png` | favicon |
| 48x48 | `icon-48.png` | favicon |
| 72x72 | `icon-72.png` | Android badge |
| 96x96 | `icon-96.png` | Android |
| 128x128 | `icon-128.png` | Android |
| 144x144 | `icon-144.png` | Android |
| 152x152 | `icon-152.png` | iOS |
| 180x180 | `apple-touch-icon.png` | Apple touch icon |
| 192x192 | `icon-192.png` | Android / manifest |
| 384x384 | `icon-384.png` | Android |
| 512x512 | `icon-512.png` | Android / splash |
| 512x512 | `icon-512-maskable.png` | Maskable icon |
| multi | `favicon.ico` | ICO (16 + 32 + 48) |

- Все PNG с прозрачным фоном (`contain` resize).
- Maskable-иконка имеет 10% белый padding для safe zone (контент занимает 80% площади).
- `favicon.ico` — контейнер с тремя PNG внутри (16, 32, 48).

---

## Стратегии кэширования

### `CacheFirst`

Сначала кэш, потом сеть.

```
Запрос → Кэш есть и не истёк? → Да → Ответ из кэша
                                 → Нет → Запрос в сеть → Сохранить в кэш → Ответ
```

- Поддерживает `maxAge` — при истечении идёт в сеть
- Поддерживает `maxEntries` — удаляет старые записи
- При ошибке сети и наличии просроченного кэша — вернёт просроченный
- Лучше всего для: картинки, шрифты, CSS/JS с хэшами

### `NetworkFirst`

Сначала сеть, потом кэш.

```
Запрос → Сеть (таймаут 3с) → Успех → Сохранить в кэш → Ответ
                             → Таймаут/ошибка → Кэш есть? → Да → Ответ из кэша
                                                            → Нет → Ошибка
```

- Таймаут 3 секунды — если сеть не ответила, сразу кэш
- Поддерживает `maxEntries`
- Лучше всего для: API, JSON-данные, динамический контент

### `StaleWhileRevalidate`

Мгновенный ответ из кэша + обновление в фоне.

```
Запрос → Кэш есть? → Да → Ответ из кэша (мгновенно)
                          → Фоновый запрос в сеть → Обновить кэш
                     → Нет → Запрос в сеть → Ответ
```

- Самая быстрая стратегия при наличии кэша
- Пользователь видит предыдущую версию, а при следующем визите — обновлённую
- Поддерживает `maxEntries`
- Лучше всего для: HTML-страницы, не-критичные данные

### `NetworkOnly`

Только сеть, без кэширования.

```
Запрос → Сеть → Ответ (или ошибка)
```

- Никогда не кэширует и не читает из кэша
- Лучше всего для: авторизация, платежи, аналитика, real-time данные

### `CacheOnly`

Только кэш, без сети.

```
Запрос → Кэш есть? → Да → Ответ
                     → Нет → 404
```

- Работает только с precache или ранее закэшированными ресурсами
- Лучше всего для: offline app shell, критичные ресурсы

---

## Сгенерированный Service Worker

SW генерируется как готовый JS-файл. Без Workbox, без runtime-зависимостей. Содержит:

- **Install** — `skipWaiting()` для мгновенной активации + precache (если настроен)
- **Activate** — удаление неизвестных кэшей, `clients.claim()` для захвата контроля
- **Fetch** — маршрутизация запросов по URL-паттернам к соответствующим стратегиям
- **Push** — обработка push-уведомлений с настраиваемыми icon/badge
- **Notification click** — фокус на существующее окно или открытие нового

Маршрутизация: glob-паттерны конвертируются в regex:
- `**` — любое количество сегментов пути
- `*` — один сегмент (без `/`)
- `{ext1,ext2}` — альтернативы

Обрабатываются только `GET`-запросы по `http(s)`. Non-GET, `chrome-extension://` и подобные пропускаются.

---

## Клиентский API

Браузерная библиотека для регистрации SW и push-уведомлений.

```ts
import { registerSW, notifications } from 'pwa-lib/client'
```

Pure ESM, zero dependencies, tree-shakeable.

### `registerSW(swUrl?, options?)`

Регистрация Service Worker с колбэками жизненного цикла.

```ts
const registration = await registerSW('/sw.js', {
  onUpdate: (reg) => {
    // Новая версия SW доступна.
    // Можно показать пользователю баннер "Обновление доступно".
    console.log('Update available')
  },
  onReady: (reg) => {
    // SW активен и контролирует страницу.
    console.log('SW ready')
  },
  onError: (err) => {
    // Ошибка регистрации.
    console.error('SW registration failed', err)
  },
})
```

| Параметр | Тип | Дефолт | Описание |
|----------|-----|--------|----------|
| `swUrl` | `string` | `'/sw.js'` | URL service worker файла |
| `options.onUpdate` | `(reg) => void` | — | Новая версия SW доступна |
| `options.onReady` | `(reg) => void` | — | SW активен |
| `options.onError` | `(err) => void` | — | Ошибка регистрации |

Бросает ошибку если Service Workers не поддерживаются.

### `notifications`

API для push-уведомлений.

```ts
// 1. Проверить поддержку
if (notifications.isSupported()) {

  // 2. Запросить разрешение
  const permission = await notifications.requestPermission()

  if (permission === 'granted') {

    // 3. Подписаться на push (нужен VAPID ключ сервера)
    const subscription = await notifications.subscribe({
      applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkGs-GDq...',
    })

    // 4. Отправить подписку на сервер
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })
  }
}

// Получить текущую подписку
const current = await notifications.getSubscription()

// Отписаться
const success = await notifications.unsubscribe()
```

| Метод | Возвращает | Описание |
|-------|------------|----------|
| `isSupported()` | `boolean` | Проверка поддержки Notification + PushManager + SW |
| `requestPermission()` | `Promise<NotificationPermission>` | Запрос разрешения у пользователя (`'granted'` / `'denied'` / `'default'`) |
| `subscribe(options)` | `Promise<PushSubscription>` | Подписка с VAPID ключом |
| `getSubscription()` | `Promise<PushSubscription \| null>` | Текущая подписка (или `null`) |
| `unsubscribe()` | `Promise<boolean>` | Отписка (`true` если была подписка) |

Формат push-payload для сервера:
```json
{
  "title": "Новое сообщение",
  "body": "У вас 3 непрочитанных сообщения",
  "icon": "/icons/icon-192.png",
  "badge": "/icons/badge-72.png",
  "data": { "url": "/messages" },
  "actions": [
    { "action": "open", "title": "Открыть" },
    { "action": "dismiss", "title": "Закрыть" }
  ],
  "tag": "messages",
  "renotify": true
}
```

При клике на уведомление SW откроет `data.url` (или `/` если не указан). Если окно приложения уже открыто — сфокусирует его.

### `createPushClient(config?)`

Высокоуровневый клиент для полного flow push-уведомлений с сервером. Один вызов `subscribe()` делает всё: проверяет поддержку, запрашивает разрешение, получает VAPID-ключ, подписывает через PushManager, отправляет подписку на сервер. Разработчику остаётся только привязать к кнопке.

Конфиг подтягивается автоматически из `pwa-push.json` (генерируется при `pwa-lib generate`). Достаточно указать `serverUrl`, `appId`, `apiKey` в `pwa.config.ts` — и в клиентском коде ничего передавать не нужно:

```ts
import { createPushClient } from 'pwa-lib/client'

const push = createPushClient()
await push.subscribe()
```

Если нужно переопределить конфиг вручную — можно передать явно:

```ts
const push = createPushClient({
  serverUrl: 'https://push.example.com',
  appId: 'my-app',
  apiKey: 'your-api-key',
})
```

#### Полный пример: кнопка подписки

Типичный сценарий — кнопка «Подписаться на уведомления» в UI:

```ts
import { registerSW, notifications, createPushClient, PushClientError } from 'pwa-lib/client'

// 1. Регистрируем SW (обязательно до работы с push)
await registerSW('/sw.js')

// 2. Создаём push-клиент (конфиг подтягивается из pwa-push.json автоматически)
const push = createPushClient()

// 3. Определяем начальное состояние кнопки
const btn = document.querySelector<HTMLButtonElement>('#push-btn')!
const status = document.querySelector<HTMLSpanElement>('#push-status')!

async function updateUI() {
  const subscription = await notifications.getSubscription()
  if (subscription) {
    btn.textContent = 'Отписаться от уведомлений'
    status.textContent = 'Уведомления включены'
  } else {
    btn.textContent = 'Подписаться на уведомления'
    status.textContent = ''
  }
}

// 4. Скрываем кнопку если браузер не поддерживает push
if (!notifications.isSupported()) {
  btn.hidden = true
  status.textContent = 'Ваш браузер не поддерживает push-уведомления'
} else {
  await updateUI()
}

// 5. Обработчик клика — toggle подписки
btn.addEventListener('click', async () => {
  btn.disabled = true

  try {
    const subscription = await notifications.getSubscription()

    if (subscription) {
      await push.unsubscribe()
    } else {
      await push.subscribe()
    }

    await updateUI()
  } catch (err) {
    if (err instanceof PushClientError) {
      switch (err.code) {
        case 'PERMISSION_DENIED':
          status.textContent = 'Вы запретили уведомления. Разрешите в настройках браузера.'
          break
        case 'NETWORK_ERROR':
        case 'VAPID_FETCH_FAILED':
        case 'SERVER_SUBSCRIBE_FAILED':
        case 'SERVER_UNSUBSCRIBE_FAILED':
          status.textContent = 'Ошибка сервера. Попробуйте позже.'
          break
        default:
          status.textContent = 'Не удалось подписаться на уведомления.'
      }
    }
  } finally {
    btn.disabled = false
  }
})
```

#### Пример с React

```tsx
import { useEffect, useState } from 'react'
import { notifications, createPushClient, PushClientError } from 'pwa-lib/client'

const push = createPushClient()

function PushButton() {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supported = notifications.isSupported()

  useEffect(() => {
    if (!supported) return
    notifications.getSubscription().then((sub) => setSubscribed(!!sub))
  }, [])

  if (!supported) return null

  async function handleClick() {
    setLoading(true)
    setError('')

    try {
      if (subscribed) {
        await push.unsubscribe()
        setSubscribed(false)
      } else {
        await push.subscribe()
        setSubscribed(true)
      }
    } catch (err) {
      if (err instanceof PushClientError) {
        if (err.code === 'PERMISSION_DENIED') {
          setError('Разрешите уведомления в настройках браузера')
        } else {
          setError('Не удалось. Попробуйте позже.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Загрузка...' : subscribed ? 'Отписаться' : 'Подписаться на уведомления'}
      </button>
      {error && <p>{error}</p>}
    </>
  )
}
```

#### Счётчик подписчиков

```ts
const count = await push.getSubscriberCount()
document.querySelector('#count')!.textContent = `${count} подписчиков`
```

#### API методов

| Метод | Возвращает | Описание |
|-------|------------|----------|
| `subscribe()` | `Promise<PushSubscriptionData>` | Полный flow: поддержка → разрешение → VAPID → PushManager → сервер |
| `unsubscribe()` | `Promise<void>` | Удаление на сервере → отписка в браузере. Если подписки нет — ничего не делает |
| `getSubscriberCount()` | `Promise<number>` | Количество подписчиков с сервера |

`subscribe()` возвращает `PushSubscriptionData`:
```ts
{
  endpoint: 'https://fcm.googleapis.com/fcm/send/...',
  keys: { p256dh: '...', auth: '...' }
}
```

`unsubscribe()` — server-first: сначала удаляем на сервере, потом в браузере. Если сервер упал — подписка в браузере остаётся, можно повторить.

#### Обработка ошибок

Все методы бросают `PushClientError` с типизированным `code`:

| Код | Когда |
|-----|-------|
| `NOT_SUPPORTED` | Браузер не поддерживает Notification / PushManager / SW |
| `PERMISSION_DENIED` | Пользователь отклонил разрешение на уведомления |
| `VAPID_FETCH_FAILED` | Сервер не вернул VAPID-ключ |
| `SUBSCRIBE_FAILED` | Ошибка PushManager.subscribe() |
| `SERVER_SUBSCRIBE_FAILED` | Сервер не принял подписку |
| `SERVER_UNSUBSCRIBE_FAILED` | Сервер не удалил подписку |
| `UNSUBSCRIBE_FAILED` | Ошибка отписки в браузере |
| `NETWORK_ERROR` | Сетевой запрос не прошёл |

Retry-логика — ответственность потребителя. `code` даёт достаточно информации, чтобы решить что показать пользователю и стоит ли повторять.

#### Серверный API

`createPushClient` ожидает следующие эндпоинты:

| Метод | Эндпоинт | Тело / Ответ |
|-------|----------|--------------|
| `GET` | `/api/apps/:appId/vapid-public-key` | → `{ vapidPublicKey: string }` — необязателен если `vapidPublicKey` передан в конфиге |
| `POST` | `/api/apps/:appId/subscribe` | `PushSubscriptionData` → `201` |
| `POST` | `/api/apps/:appId/unsubscribe` | `{ endpoint: string }` → `200` |
| `GET` | `/api/apps/:appId/subscribers/count` | → `{ count: number }` |

Все запросы (кроме `vapid-public-key`) содержат заголовки `Content-Type: application/json` и `X-API-Key: <apiKey>`.

---

## TypeScript

Все экспорты полностью типизированы.

```ts
import type {
  PwaConfig,
  ResolvedPwaConfig,
  CacheStrategy,
  RouteConfig,
  SwConfig,
  ManifestConfig,
  NotificationsConfig,
  IconEntry,
} from 'pwa-lib'
```

| Тип | Описание |
|-----|----------|
| `PwaConfig` | Пользовательский конфиг (все поля опциональны) |
| `ResolvedPwaConfig` | Конфиг после merge с дефолтами (все поля обязательны) |
| `CacheStrategy` | `'CacheFirst' \| 'NetworkFirst' \| 'StaleWhileRevalidate' \| 'NetworkOnly' \| 'CacheOnly'` |
| `RouteConfig` | Маршрут: `match`, `strategy`, `cache?`, `maxAge?`, `maxEntries?` |
| `SwConfig` | `output?`, `precache?`, `routes?` |
| `ManifestConfig` | Все поля manifest (все опциональны) |
| `NotificationsConfig` | `enabled?`, `defaultIcon?`, `badge?`, `vapidPublicKey?`, `serverUrl?`, `appId?`, `apiKey?` |
| `IconEntry` | `size`, `name`, `purpose?` |
| `PushClientConfig` | `serverUrl?`, `appId?`, `apiKey?`, `vapidPublicKey?` |
| `PushClient` | Интерфейс объекта от `createPushClient()`: `subscribe()`, `unsubscribe()`, `getSubscriberCount()` |
| `PushSubscriptionData` | `endpoint`, `keys: { p256dh, auth }` |
| `PushClientErrorCode` | Union кодов ошибок: `'NOT_SUPPORTED' \| 'PERMISSION_DENIED' \| ...` |

## Экспорты пакета

| Путь импорта | Описание |
|--------------|----------|
| `pwa-lib` | Типы, `defineConfig()`, константы (`DEFAULT_CONFIG`, `DEFAULT_ROUTES`, `ICON_SEARCH_PATHS`) |
| `pwa-lib/config` | Алиас для `pwa-lib` (для использования в конфиг-файлах) |
| `pwa-lib/client` | Браузерный API: `registerSW()`, `notifications`, `createPushClient()`, `PushClientError` |

---

## Структура проекта

```
pwa-lib/
├── src/
│   ├── cli/                    # CLI точка входа
│   │   ├── index.ts            # bin entry — citty router
│   │   ├── commands/
│   │   │   ├── init.ts         # pwa-lib init
│   │   │   ├── generate.ts     # pwa-lib generate
│   │   │   ├── icons.ts        # pwa-lib icons
│   │   │   └── dev.ts          # pwa-lib dev
│   │   └── utils/
│   │       ├── logger.ts       # consola логгер
│   │       └── config-loader.ts # Загрузка конфига через jiti + defu
│   ├── core/                   # Движки генерации
│   │   ├── icons/
│   │   │   ├── generator.ts    # sharp pipeline + ICO builder
│   │   │   └── sizes.ts        # Пресеты размеров иконок
│   │   ├── sw/
│   │   │   ├── builder.ts      # Сборка финального sw.js
│   │   │   ├── strategies.ts   # 5 стратегий кэширования
│   │   │   ├── runtime.ts      # Runtime-конфиг для SW
│   │   │   └── templates/
│   │   │       ├── sw-core.ts  # Install/activate lifecycle
│   │   │       ├── caching.ts  # Fetch handler + route matching
│   │   │       ├── precache.ts # Precache-список
│   │   │       └── push.ts     # Push-уведомления
│   │   └── manifest/
│   │       └── generator.ts    # Генерация manifest.json
│   ├── client/                 # Браузерная библиотека
│   │   ├── index.ts            # Экспорты
│   │   ├── sw-register.ts      # registerSW()
│   │   ├── notifications.ts    # Push API (низкоуровневый)
│   │   ├── push-client.ts      # createPushClient() — высокоуровневый push-клиент
│   │   ├── push-client.types.ts # Типы для push-клиента
│   │   └── types.ts            # Клиентские типы
│   └── shared/                 # Общие типы и дефолты
│       ├── index.ts            # Экспорты
│       ├── types.ts            # PwaConfig, defineConfig()
│       └── defaults.ts         # Дефолтные значения
├── package.json
├── tsconfig.json
└── tsup.config.ts              # 3 сборки: CLI, client, shared
```

## Зависимости

| Пакет | Назначение |
|-------|------------|
| [sharp](https://sharp.pixelplumbing.com/) | Нативная обработка изображений для генерации иконок |
| [citty](https://github.com/unjs/citty) | Лёгкий типизированный CLI-фреймворк |
| [consola](https://github.com/unjs/consola) | Красивый консольный логгер |
| [jiti](https://github.com/unjs/jiti) | Загрузка .ts конфигов без ts-node |
| [defu](https://github.com/unjs/defu) | Глубокий merge конфигов с дефолтами |
| [globby](https://github.com/sindresorhus/globby) | Glob-паттерны для precache |

## Лицензия

MIT
