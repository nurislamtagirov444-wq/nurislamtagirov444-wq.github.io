#!/bin/bash
# Установщик Android-тулчейна для сборки APK на ВАШЕЙ машине (Ubuntu/Debian).
# В песочнице Arena это запускать бессмысленно: dl.google.com/services.gradle.org
# оттуда недоступны — поэтому скрипт живёт в репо и запускается локально.
# Проверено: версии пинуются 2026-08-01. Использование: bash scripts/setup-android-toolchain.sh
set -euo pipefail

TOOLS_DIR="${ANDROID_TOOLS_DIR:-$HOME/android-tools}"
SDK_ROOT="$TOOLS_DIR/sdk"
CMDLINE_ZIP="commandlinetools-linux-13114758_latest.zip" # cmdline-tools 19.0

echo "== 1/5: JDK (Temurin 21)"
if ! java -version 2>&1 | grep -q '21\.'; then
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y wget apt-transport-https gpg
    wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/adoptium.gpg
    echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
    sudo apt-get update && sudo apt-get install -y temurin-21-jdk
  else
    echo "Нет apt — поставьте JDK 21 (Temurin) вручную: https://adoptium.net/temurin/releases/?version=21"
    exit 1
  fi
fi
java -version 2>&1 | head -1

echo "== 2/5: Android command line tools"
mkdir -p "$SDK_ROOT/cmdline-tools"
if [ ! -d "$SDK_ROOT/cmdline-tools/latest" ]; then
  cd /tmp
  curl -fLO "https://dl.google.com/android/repository/$CMDLINE_ZIP"
  unzip -q "$CMDLINE_ZIP" -d "$SDK_ROOT/cmdline-tools"
  mv "$SDK_ROOT/cmdline-tools/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
fi

echo "== 3/5: sdkmanager: platform-tools, platform, build-tools"
export ANDROID_HOME="$SDK_ROOT"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
yes | sdkmanager --licenses >/dev/null
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

echo "== 4/5: переменные окружения"
# shellcheck disable=SC2016
echo 'export ANDROID_HOME="'"$SDK_ROOT"'"' >> ~/.bashrc
# shellcheck disable=SC2016
echo 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.bashrc
source ~/.bashrc

echo "== 5/5: синк проекта и сборка debug APK"
cd "$(dirname "$0")/.."
npm ci
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
APK=$(find app/build/outputs/apk -name "*.apk" | head -1)
echo "ГОТОВО: $APK"
