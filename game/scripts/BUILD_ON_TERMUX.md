# Сборка APK прямо на телефоне (Termux, aarch64)

⚠️ Сначала попробуйте путь через GitHub Actions (см. `build-apk.github-workflow.yml`) —
он в разы проще. Этот гайд — для тех, кто осознанно хочет собирать локально.

Ограничения, которые обходим: Termux = aarch64; Google's `aapt2` в build-tools собран
только под x86-64 → подменяем его termux-пакетным `aapt2` через
`android.aapt2FromMavenOverride`. Стройбот-нужды: ~6 ГБ свободного места, 30–60 мин.

```bash
# 0. Обновить пакеты, поставить инструменты
pkg update -y && pkg upgrade -y
pkg install -y git nodejs openjdk-21 aapt2 wget unzip

# 1. Клонировать репо С НУЖНОЙ ВЕТКОЙ (git pull в пустой папке — не работает)
git clone -b arena/019fbeee-nurislamtagirov444-wq-github-i \
  https://github.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io.git
cd nurislamtagirov444-wq.github.io/game

# 2. Зависимости проекта и веб-бандл
npm ci
npm run build

# 3. Android command line tools + SDK (dl.google.com из Termux доступен)
export ANDROID_HOME=$HOME/android-sdk
mkdir -p $ANDROID_HOME/cmdline-tools
cd /tmp
wget https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip
unzip -q commandlinetools-linux-*_latest.zip -d $ANDROID_HOME/cmdline-tools
mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

# 4. КРИТИЧНО: подмена aapt2 на aarch64-версию Termux
cd ~/nurislamtagirov444-wq.github.io/game
echo "android.aapt2FromMavenOverride=$(command -v aapt2)" >> android/gradle.properties

# 5. Синк и сборка debug-APK
npx cap sync android
cd android
./gradlew assembleDebug --no-daemon

# 6. Готовый APK
ls app/build/outputs/apk/debug/app-debug.apk
# Установка (разрешите «установку из неизвестных источников» для Termux):
#   cp app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/
# дальше откройте файл через любой файловый менеджер.
```

Если `./gradlew` ругается на localhost/daemon — флаг `--no-daemon` обязателен.
Если aapt2 из build-tools всё равно дёргается — проверьте, что строка из п.4
попала в `android/gradle.properties` и путь `command -v aapt2` не пустой.
Сборка release-APK на телефоне не рекомендуется (zipalign тоже x86-64) — debug
полностью играбелен.
