# Маяк в ноябре

Психологическая романтическая драма. Визуальная новелла. Phaser 3 + TypeScript + Vite.
Оригинальные сюжет, персонажи и арт. Только взрослые персонажи (18+), без NSFW.

## Быстрый старт (web)

```bash
cd game
npm install
npm run dev        # http://localhost:5173
```

Production-сборка и предпросмотр:

```bash
npm run build      # -> game/dist
npm run preview    # статический сервер поверх dist
```

## Проверки

```bash
npm test           # 11 unit-тестов ядра (node --test, без зависимостей)
npm run smoke      # автоплей: DFS по графу, доказательство достижимости всех концовок
```

E2E в реальном браузере (Chromium через puppeteer-core + @sparticuz/chromium):

```bash
npm i -D puppeteer-core@24 @sparticuz/chromium@141
npx vite preview --port 4499 &
E2E_URL=http://localhost:4499/ node scripts/e2e.mjs --shots
```

## Сборка APK (на вашей машине)

Быстрый путь (Ubuntu/Debian) — один скрипт ставит JDK 21, Android SDK
(cmdline-tools, platform-tools, `platforms;android-35`, `build-tools;35.0.0`),
синхронизирует Capacitor и собирает debug-APK:

```bash
cd game && bash scripts/setup-android-toolchain.sh
```

Ручной путь (любая ОС):
1. JDK 21 (Temurin): https://adoptium.net/temurin/releases/?version=21
2. Android Studio либо cmdline-tools: platform-tools, `platforms;android-35`, `build-tools;35.0.0`.
3. В `game/`: `npm ci && npm run build && npx cap sync android`
4. `npx cap open android` → Run ▶ / Build APK; либо CLI: `cd android && ./gradlew assembleDebug`

Проект: Capacitor 8.5.0, `android/` уже сгенерирован и закоммичен, плагин
`@capacitor/app` (hardware «назад») подключён, ориентация залочена в landscape
(`sensorLandscape` в AndroidManifest), minSdk/targetSdk — из `android/variables.gradle` (Capacitor 8: minSdk 23+, targetSdk 35).
Release-APK: `./gradlew assembleRelease` (подпись — своя keystore, Android Studio предложит).

## Состав (P0)

- Движок истории: 5 типов узлов, проверки статов, таймированные выборы, карта города.
- 148 узлов сюжета: пролог + 3 акта + день 4 (ветка Марины), 4 концовки.
- Сейвы: 9 слотов + quick/auto, checksum, авто-очистка повреждённых, merge «прочитанного».
- UI: титул, текстбокс с печатью, выборы, quick-меню, журнал (100), статы, настройки,
  пауза, эффекты низкой Ясности, экран концовки и эпилога.
- Аудио: процедурный WebAudio-синтез эмбиента (дождь/море/ветер/радио/комната) и
  UI-звуков. В игре нет ни одного аудиофайла.
- Арт: 7 фонов + 3 портрета (сгенерированы, оригинальные). Концовки — композиции с
  цветокором (отдельные CG и портреты Дарьи/Штерна — срез P1, лимит генерации 10/сессия).

Структура кода и конечный автомат экранов — см. `../SPEC.md` (единый источник правды).
