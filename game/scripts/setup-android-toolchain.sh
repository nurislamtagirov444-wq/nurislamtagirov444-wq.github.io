#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Полная установка Android-тулчейна и сборка APK «Маяк в ноябре»
# на свежей Ubuntu 22.04 (x86_64). Подходит для облачных ВМ.
#
# Скрипт сам ставит: базовые пакеты, Node.js 22, Temurin JDK 21,
# Android SDK (platform-tools, android-36, build-tools 36.x),
# затем собирает веб-бандл и debug APK.
#
# Использование (из каталога game/ в клоне репозитория):
#   bash scripts/setup-android-toolchain.sh
#
# Безопасно запускать повторно: готовые шаги пропускаются.
# В песочнице Arena скрипт НЕ сработает (доступ к dl.google.com /
# services.gradle.org там закрыт) — он живёт в репо для вашей машины.
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAME_DIR="$(dirname "$SCRIPT_DIR")"

TOOLS_DIR="${ANDROID_TOOLS_DIR:-$HOME/android-tools}"
SDK_ROOT="$TOOLS_DIR/sdk"
CMDLINE_ZIP="commandlinetools-linux-13114758_latest.zip" # cmdline-tools 19.0
SDK_PLATFORM="platforms;android-36"   # см. game/android/variables.gradle (compileSdk 36)
BUILD_TOOLS_RE='build-tools;36\.[0-9.]+'

# sudo только если мы не root и sudo есть
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then SUDO="sudo"; else
    echo "ОШИБКА: вы не root и sudo не установлен. Выполните: su - либо установите sudo."
    exit 1
  fi
fi

apt_install() { DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y "$@"; }

echo "== 0/6: базовые пакеты (curl, wget, unzip, git, gnupg)"
if ! command -v apt-get >/dev/null 2>&1; then
  echo "ОШИБКА: нет apt-get. Скрипт рассчитан на Ubuntu/Debian."
  exit 1
fi
$SUDO apt-get update -qq
apt_install curl wget unzip zip git ca-certificates gnupg

echo "== 1/6: Node.js 22 (нужен для сборки веб-бандла)"
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
  [ "$NODE_MAJOR" -ge 20 ] && NEED_NODE=0
fi
if [ "$NEED_NODE" -eq 1 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO -E bash -
  apt_install nodejs
fi
echo "node $(node -v), npm $(npm -v)"

echo "== 2/6: JDK (Temurin 21, требуется Android Gradle Plugin 8.13)"
if ! java -version 2>&1 | grep -q '21\.'; then
  apt_install wget apt-transport-https
  wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | $SUDO gpg --dearmor -o /etc/apt/trusted.gpg.d/adoptium.gpg
  CODENAME="$(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release)"
  echo "deb https://packages.adoptium.net/artifactory/deb $CODENAME main" | $SUDO tee /etc/apt/sources.list.d/adoptium.list >/dev/null
  $SUDO apt-get update -qq && apt_install temurin-21-jdk
fi
JAVA_HOME_BIN="$(readlink -f "$(command -v javac)")"
export JAVA_HOME="$(dirname "$(dirname "$JAVA_HOME_BIN")")"
java -version 2>&1 | head -1

echo "== 3/6: Android command line tools"
mkdir -p "$SDK_ROOT/cmdline-tools"
if [ ! -d "$SDK_ROOT/cmdline-tools/latest" ]; then
  TMP_ZIP="$(mktemp -d)/cmdline-tools.zip"
  curl -fL "https://dl.google.com/android/repository/$CMDLINE_ZIP" -o "$TMP_ZIP"
  unzip -q "$TMP_ZIP" -d "$SDK_ROOT/cmdline-tools"
  mv "$SDK_ROOT/cmdline-tools/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
  rm -f "$TMP_ZIP"
fi
export ANDROID_HOME="$SDK_ROOT"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "== 4/6: sdkmanager: $SDK_PLATFORM + build-tools 36.x + platform-tools"
yes | sdkmanager --licenses >/dev/null 2>&1 || true
sdkmanager "platform-tools" "$SDK_PLATFORM"
BT="$(sdkmanager --list 2>/dev/null | grep -oE "$BUILD_TOOLS_RE" | sort -V | tail -1)"
if [ -z "$BT" ]; then BT="build-tools;36.0.0"; fi
sdkmanager "$BT"
echo "build-tools: $BT"

echo "== 5/6: переменные окружения (в ~/.bashrc, без дублей)"
add_line() { grep -qxF "$1" ~/.bashrc 2>/dev/null || echo "$1" >> ~/.bashrc; }
add_line "export ANDROID_HOME=\"$SDK_ROOT\""
add_line 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"'
add_line "export JAVA_HOME=\"$JAVA_HOME\""

echo "== 6/6: сборка веб-бандла и debug APK"
cd "$GAME_DIR"
npm ci
npm run build
npx cap sync android
cd android
./gradlew assembleDebug

APK="$(find "$(pwd)/app/build/outputs/apk" -name '*.apk' | head -1)"
[ -n "$APK" ] || { echo "ОШИБКА: APK не найден."; exit 1; }
echo "════════════════════════════════════════════════════════════════"
echo "ГОТОВО. APK: $APK"
echo "Размер: $(du -h "$APK" | cut -f1)   SHA-256: $(sha256sum "$APK" | cut -d' ' -f1)"
echo "Забрать на телефон через Termux:"
echo "  scp $(whoami)@<IP-этой-машины>:'$APK' /sdcard/Download/"
echo "или поднять временный сервер и скачать браузером:"
echo "  cd $(dirname "$APK") && python3 -m http.server 8080"
echo "  → на телефоне открыть http://<IP-машины>:8080/$(basename "$APK")"
