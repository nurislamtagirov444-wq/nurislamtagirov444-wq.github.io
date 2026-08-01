#!/usr/bin/env bash
# ==============================================================================
# 🛠️ FIX CLAUDE CODE IN TERMUX — Исправление ошибки "claude native binary not installed"
# Автоматическая настройка Claude Code внутри Debian GNU/Linux (proot-distro),
# где бинарники glibc (Linux ARM64 / x86_64) работают без ошибок несовместимости с Android.
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "=============================================================================="
echo "    🛠️ ИСПРАВЛЕНИЕ ЗАПУСКА CLAUDE CODE В TERMUX (DEBIAN LINUX GLIBC)          "
echo "=============================================================================="
echo -e "${RESET}"

IS_TERMUX=false
if [ -d "/data/data/com.termux/files/usr" ] || [[ "$PREFIX" == *"com.termux"* ]]; then
    IS_TERMUX=true
elif [ -n "$TERMUX_VERSION" ]; then
    IS_TERMUX=true
fi

if [ "$IS_TERMUX" = true ]; then
    BIN_DIR="$PREFIX/bin"
else
    BIN_DIR="/usr/local/bin"
    if [ ! -w "$BIN_DIR" ]; then
        BIN_DIR="$HOME/.local/bin"
        mkdir -p "$BIN_DIR"
    fi
fi

mkdir -p "$BIN_DIR"

# --- Шаг 1. Пытаемся запустить postinstall в нативном Termux ---
echo -e "${BLUE}[1/4] Проверка локального пакета @anthropic-ai/claude-code в Termux...${RESET}"
if [ -f "$PREFIX/lib/node_modules/@anthropic-ai/claude-code/install.cjs" ]; then
    echo -e "${CYAN} -> Выполняем postinstall скрипт node install.cjs...${RESET}"
    node "$PREFIX/lib/node_modules/@anthropic-ai/claude-code/install.cjs" 2>/dev/null || true
fi

# --- Шаг 2. Устанавливаем и настраиваем Debian в proot-distro (где есть glibc) ---
if [ "$IS_TERMUX" = true ]; then
    echo -e "${BLUE}[2/4] Проверка Linux-пространства Debian GNU/Linux (proot-distro)...${RESET}"
    if ! command -v proot-distro >/dev/null 2>&1; then
        pkg update -y && pkg install -y proot-distro
    fi
    proot-distro install debian 2>/dev/null || echo -e "${GREEN} -> Дистрибутив debian уже установлен.${RESET}"

    echo -e "${BLUE}[3/4] Установка Node.js, npm и официального Claude Code (@anthropic-ai/claude-code) внутри Debian Linux...${RESET}"
    echo -e "${CYAN} -> Внутри Debian используются стандартные Linux бинарники glibc, которые работают без ошибок Android bionic!${RESET}"
    
    proot-distro login debian -- apt-get update -y
    proot-distro login debian -- apt-get install -y curl wget git ca-certificates nodejs npm build-essential || true
    
    # Установка claude-code в Debian с разрешением выполнения postinstall
    proot-distro login debian -- bash -c "npm config set allow-scripts=@anthropic-ai/claude-code --location=user 2>/dev/null; npm install -g --allow-scripts=@anthropic-ai/claude-code @anthropic-ai/claude-code || npm install -g @anthropic-ai/claude-code"

    # --- Шаг 4. Создаем умный скрипт-обертку 'claude' в Termux ---
    echo -e "${BLUE}[4/4] Создание умной обертки 'claude' и 'claude-root' в $BIN_DIR...${RESET}"

    # Сохраняем нативный скрипт как claude-bionic если он есть
    if [ -f "$BIN_DIR/claude" ] && [ ! -L "$BIN_DIR/claude" ] && ! grep -q "proot-distro" "$BIN_DIR/claude" 2>/dev/null; then
        mv "$BIN_DIR/claude" "$BIN_DIR/claude-bionic" 2>/dev/null || true
    fi

    # Создаем обертку claude
    cat << 'EOF' > "$BIN_DIR/claude"
#!/usr/bin/env bash
# ==============================================================================
# Умная обертка для запуска Claude Code в Termux через Debian GNU/Linux (proot)
# Автоматически передает текущую папку, API ключи и аргументы в Linux-окружение
# ==============================================================================

# Загружаем ключи провайдера из ~/.config/claude_provider.env (настроенные через claude-key)
if [ -f "$HOME/.config/claude_provider.env" ]; then
    source "$HOME/.config/claude_provider.env"
fi

# Если запуск внутри Debian proot — выполняем напрямую
if [ -f "/etc/debian_version" ] || [ "$(id -u)" -eq 0 ]; then
    if command -v claude-bin >/dev/null 2>&1; then
        exec claude-bin "$@"
    elif [ -f "/usr/local/bin/claude" ] && [ "$0" != "/usr/local/bin/claude" ]; then
        exec "/usr/local/bin/claude" "$@"
    elif command -v node >/dev/null 2>&1 && [ -f "/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.mjs" ]; then
        exec node "/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.mjs" "$@"
    fi
fi

# В Termux запускаем Claude Code внутри Debian Linux с сохранением текущего каталога
if command -v proot-distro >/dev/null 2>&1; then
    WORKSPACE_DIR="$HOME/claude_workspace"
    mkdir -p "$WORKSPACE_DIR"
    exec proot-distro login debian \
        --bind "$HOME:/home/termux" \
        --bind "$HOME/.config:/root/.config" \
        --bind "$WORKSPACE_DIR:/root/workspace" \
        -- /bin/bash -c "source /root/.config/claude_provider.env 2>/dev/null; cd \"$PWD\" 2>/dev/null || cd /root/workspace; exec claude \"\$@\"" -- "$@"
else
    # Fallback если proot-distro недоступен
    if [ -f "$PREFIX/lib/node_modules/@anthropic-ai/claude-code/cli.mjs" ]; then
        exec node "$PREFIX/lib/node_modules/@anthropic-ai/claude-code/cli.mjs" "$@"
    else
        echo -e "\033[1;31m❌ Ошибка: Claude Code требует Debian Linux. Запустите: fix_claude.sh\033[0m"
        exit 1
    fi
fi
EOF
    chmod +x "$BIN_DIR/claude"
    ln -sf "$BIN_DIR/claude" "$BIN_DIR/claude-ai"

    # Также обновляем claude-root для запуска в root рабочей папке /root/workspace
    cat << 'EOF' > "$BIN_DIR/claude-root"
#!/usr/bin/env bash
# Запуск Claude Code внутри Debian GNU/Linux под root в директории ~/claude_workspace
WORKSPACE_DIR="$HOME/claude_workspace"
mkdir -p "$WORKSPACE_DIR"
if [ -f "$HOME/.config/claude_provider.env" ]; then
    source "$HOME/.config/claude_provider.env"
fi
echo -e "\033[1;35m========================================================\033[0m"
echo -e "\033[1;35m      🤖 CLAUDE ROOT WORKSPACE (Debian GNU/Linux)       \033[0m"
echo -e "\033[1;35m========================================================\033[0m"
exec proot-distro login debian \
    --bind "$HOME:/home/termux" \
    --bind "$HOME/.config:/root/.config" \
    --bind "$WORKSPACE_DIR:/root/workspace" \
    -- /bin/bash -c "source /root/.config/claude_provider.env 2>/dev/null; cd /root/workspace && exec claude \"\$@\"" -- "$@"
EOF
    chmod +x "$BIN_DIR/claude-root"

    echo -e ""
    echo -e "${GREEN}${BOLD}==============================================================================${RESET}"
    echo -e "${GREEN}${BOLD}  ✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО! CLAUDE CODE НАСТРОЕН В DEBIAN LINUX PROOT       ${RESET}"
    echo -e "${GREEN}${BOLD}==============================================================================${RESET}"
    echo -e "🎉 Ошибка ${RED}'claude native binary not installed'${RESET} устранена!"
    echo -e "Теперь команды ${BOLD}claude${RESET}, ${BOLD}claude-ai${RESET} и ${BOLD}claude-root${RESET} автоматически запускают"
    echo -e "официальный Claude Code в среде Debian Linux, где бинарники glibc работают на 100%!"
    echo -e ""
    echo -e "Ваш активный API ключ от ${BOLD}claude-key${RESET} (${CYAN}https://seekai.cc${RESET}) автоматически подключен!"
    echo -e "Проверьте работу командой:"
    echo -e "  ${BOLD}${GREEN}claude --version${RESET}   или   ${BOLD}${GREEN}claude-root${RESET}"
    echo -e "${GREEN}==============================================================================${RESET}"
else
    # Стандартный Linux
    echo -e "${CYAN} -> В стандартном Linux переустанавливаем Claude Code с разрешением скриптов...${RESET}"
    npm config set allow-scripts=@anthropic-ai/claude-code --location=user 2>/dev/null || true
    npm install -g --allow-scripts=@anthropic-ai/claude-code @anthropic-ai/claude-code || npm install -g @anthropic-ai/claude-code
    echo -e "${GREEN}✅ Claude Code переустановлен!${RESET}"
fi
