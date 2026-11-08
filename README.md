<img width="1920" height="1200" alt="Grand Theft Auto  San Andreas Screenshot 2026 11 08 - 14 34 47 13" src="https://github.com/user-attachments/assets/5a158c5a-2a30-439a-b4b2-410c756e29ed" />
# RADMIR CRMP — кастомный HUD (`RadmirHud.asi`)

Кастомный HUD и информер захвата для RADMIR CRMP (Cohtml/HTML UI).

Плагин не меняет `uiresources` и `manifest.json`: он внедряет готовый React-бандл
в уже работающий UI-вьюпорт игры и перехватывает обновления официального HUD.

## Что внутри

| Путь | Назначение |
| --- | --- |
| `src/` | React-компоненты HUD, состояние и мост к официальному API |
| `src/radmirBridge.ts` | Патч `getInterface` / `openInterface` / `closeInterface`, прокси `Hud.info`, перехват `Capture` |
| `vite.inject.config.ts` | Сборка одного IIFE-файла `dist/hud.inject.js` с встроенным CSS |
| `scripts/embed-to-cpp.mjs` | Превращает бандл в `asi_plugin/src/embedded_hud.h` |
| `asi_plugin/src/dllmain.cpp` | ASI-плагин: поиск `cohtml.WindowsDesktop.dll`, хук `ViewImpl::ExecuteScript`, инъекция, F10 |
| `asi_plugin/build-asi.bat` | Сборка `asi_plugin/RadmirHud.asi` (MSVC x86 или llvm-mingw i686) |

## Сборка

```powershell
cd C:\eradmir
npm install
npm run build:inject
cmd /c asi_plugin\build-asi.bat
```

`npm run build:inject` делает три вещи:

1. проверяет типы (`tsc --noEmit`);
2. собирает минифицированный IIFE `dist/hud.inject.js` и встраивает CSS в `<style>`;
3. генерирует `asi_plugin/src/embedded_hud.h`.

Результат: `asi_plugin/RadmirHud.asi` (Win32/x86, под `gta_sa.exe`).

## Установка

Скопировать в корень игры (`C:\Program Files (x86)\RADMIR Games\RADMIR CRMP`):

- `asi_plugin\RadmirHud.asi` — обязательно;
- `dist\hud.inject.js` — опционально, для режима разработки (см. ниже).

ASI-загрузчик в игре уже есть (рядом лежат `MoonLoader.asi`, `CLEO.asi` и т.д.).

## Как это работает

- Плагин ждёт загрузки `cohtml.WindowsDesktop.dll`.
- Находит `cohtml::View::ExecuteScript` по сигнатуре пролога, а слот 61 vtable
  `ViewImpl` — по указателю на функцию (есть fallback на известные RVA).
- Подменяет слот vtable на detour. Оригинальный вызов сохраняется и вызывается всегда.
- Перед первым «UI-скриптом» (`Hud`, `getInterface`, `interface(`) внедряется бандл,
  чтобы первый же апдейт HUD уже прошёл через мост. Есть fallback после 80 вызовов.
- Бандл создаёт `#custom-radmir-hud-root` (fixed, `pointer-events: none`, `z-index: 9999`),
  не трогая официальный `#app`.
- Запуск HUD не зависит от таймеров и длительности логина. React монтируется по
  игровому триггеру: появление штатного `.hud-radmir-info` в DOM или первый вызов
  метода `Hud` (`setInterfaceParams`/`updateParams`). Если игрок долго сидит в меню,
  HUD просто ждёт.
- Первый рендер выполняется через `flushSync`, чтобы Cohtml не откладывал
  concurrent-задачи React 18 на неопределённый срок.
- В бандл встроены мини-полифиллы `URLSearchParams` и `queueMicrotask`: Cohtml их
  не предоставляет, и без них падала инициализация хука `preview`.
- `radmirBridge` подменяет `window.getInterface` и возвращает прокси для `Hud`/`Capture`:
  - `Hud.info.health / armour / money / weapon / ammoInClip / totalAmmo`, а также
    `hunger / breath / freeze / wanted / online / id / fastHealCount / fastFoodCount` → `window.updateRadmirHud`;
  - `showGreenZoneTab / hideGreenZoneTab / showFishingZone / hideFishingZone / showGPS / hideGPS /
    showPersonalTag / hidePersonalTag` → зоны и расстояния на радаре;
  - ник и кейс-поинты читаются из `window.App.$store.getters['player/nickName']` и
    `['player/casePoints']` (опрос раз в секунду, с fallback на `$store.state.player`);
  - `openInterface('Capture', [...])`, `updateScoreboard*`, `close` → информер захвата
    (первый участник — атака, второй — защита);
  - официальные `.hud-radmir-info`, `.hud-hassle-info`, `.hud-mobile__info`,
    `.hud-radmir-radar`, `.hud-hassle-radar` скрываются только после успешного commit
    кастомного HUD; если React упал, штатный HUD остаётся видимым (fail-open).
    Уведомления не затрагиваются.
- Раскладка повторяет Amazing RP:
  - справа сверху — время/дата, ник (+ ID, если клиент его отдаёт), логотип **RADMIR**
    с номером сервера (`$store.getters['player/serverId']`), иконка оружия и
    пилюли (броня, здоровье с полосой, голод, деньги, патроны);
  - под кластером — статус-строка: звёзды розыска, заморозка, дыхание (каждый
    элемент появляется только когда активен);
  - по центру снизу — информер захвата «Защита / Атака» с таймером и названиями
    банд;
  - штатный радар и чат не изменяются.
- CSS скоупится под `#custom-radmir-hud-root`, Tailwind preflight отключён — стили
  официального интерфейса не затрагиваются.

## Режим разработки и F10

Порядок загрузки бандла:

1. `hud.inject.js` рядом с `.asi`;
2. `scripts\hud.inject.js` рядом с `.asi`;
3. встроенный бандл из `embedded_hud.h`.

Поэтому для итераций достаточно держать `hud.inject.js` в корне игры:

```powershell
npm run build:inject
Copy-Item dist\hud.inject.js "C:\Program Files (x86)\RADMIR Games\RADMIR CRMP\hud.inject.js" -Force
```

Затем нажать **F10** в игре — бандл переинжектится без перезапуска.
F10 читается через `GetAsyncKeyState`, поэтому работает и в полноэкранном режиме.
Повторные срабатывания при удержании клавиши ограничены (не чаще одного раза в секунду).

Если удалить `hud.inject.js`, плагин будет использовать встроенную копию.

### Диагностическая панель

Диагностика включается автоматически, когда найден внешний `hud.inject.js`
(режим разработчика), либо если рядом с `.asi` лежит файл `RadmirHud.debug`.
В этом режиме в левом нижнем углу появляется панель:

- `Bundle evaluated; waiting for the game Hud interface trigger.` — бандл принят Cohtml,
  HUD ждёт входа в мир;
- `JAVASCRIPT ERROR: ...` — ошибка выполнения (например, отсутствующий API движка);
- `React render error: ...` — ошибка рендера React;
- `HUD rendered ...` — панель успешно отрисована, сообщение скрывается.

У обычного игрока внешнего файла и маркера нет, поэтому диагностика не показывается.

## Лог и диагностика

Рядом с `RadmirHud.asi` создаётся `RadmirHud.log`:

- `hook installed` — хук установлен;
- `UI view detected` / `UI view fallback` — выбран вьюпорт;
- `using external bundle` / `using embedded bundle` — источник бандла;
- `injecting N bytes` — инъекция выполнена;
- `vtable scan failed` — сработал fallback слота, стоит проверить версию `cohtml`.

Если HUD не появился:

1. проверить, что игра 32-битная и `RadmirHud.asi` лежит в корне;
2. посмотреть `RadmirHud.log` — возможно, `cohtml.WindowsDesktop.dll` ещё не загружен;
3. убедиться, что другой плагин не патчит тот же слот vtable;
4. нажать F10 после обновления `hud.inject.js`.

## Браузерный предпросмотр

```powershell
npm run dev
```

В dev-режиме открывается предпросмотр с демо-значениями. В production-бандле
предпросмотр выключен; принудительно включается параметром `?debug=1`.

## Ограничения

- Официальный `Capture` не передаёт «игроков в зоне» и номер территории,
  поэтому эти строки скрываются, пока значения равны нулю.
- Плагин не отправляет никаких сетевых запросов и не изменяет файлы игры.
