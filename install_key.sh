#!/usr/bin/env bash
# ==============================================================================
# Установка команды claude-key / claude-switch в Termux и Linux
# ==============================================================================

set -e

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

echo "📥 Загрузка свежей версии claude-key в $BIN_DIR..."

curl -sSL "https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/scripts/claude_switch.sh" -o "$BIN_DIR/claude-key" 2>/dev/null || \
curl -sSL "https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/main/scripts/claude_switch.sh" -o "$BIN_DIR/claude-key" || {
    SCRIPT_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/claude_switch.sh"
    if [ -f "$SCRIPT_SRC" ]; then
        cp "$SCRIPT_SRC" "$BIN_DIR/claude-key"
    fi
}

chmod +x "$BIN_DIR/claude-key"

if [ -d "/usr/bin" ] && [ -w "/usr/bin" ]; then
    cp "$BIN_DIR/claude-key" "/usr/bin/claude-key" 2>/dev/null || true
    chmod +x "/usr/bin/claude-key" 2>/dev/null || true
fi
if [ -d "/bin" ] && [ -w "/bin" ]; then
    cp "$BIN_DIR/claude-key" "/bin/claude-key" 2>/dev/null || true
    chmod +x "/bin/claude-key" 2>/dev/null || true
fi

# Создаем синонимы (алиасы) для удобства
ln -sf "$BIN_DIR/claude-key" "$BIN_DIR/claude-switch"
ln -sf "$BIN_DIR/claude-key" "$BIN_DIR/ai-key"

echo "✅ Команда 'claude-key' (и алиасы 'claude-switch', 'ai-key') успешно установлена!"
echo ""
echo "Использование:"
echo "  claude-key <URL> <КЛЮЧ> [МОДЕЛЬ]"
echo ""
echo "Пример:"
echo "  claude-key https://seekai.cc/v1 sk-your-key-here claude-3-5-sonnet-20241022"
