#!/usr/bin/env bash
# ==============================================================================
# 🚀 SETUP TERMUX & AI LINUX SPACE
# Автоматический скрипт для полной настройки пустого Termux (с F-Droid) и Linux:
#  1. Установка Claude (@anthropic-ai/claude-code, Python SDK, утилиты)
#  2. Создание изолированной рабочей папки с правами root (proot -0 и proot-distro)
#  3. Установка языков программирования (Python, Node.js, Go, Rust, C/C++, Ruby, PHP, Perl, Java)
#  4. Установка браузеров (ai-browser со вкладками, w3m, lynx, chromium/firefox в Linux)
#  5. Установка аналогов Claude и ChatGPT для Linux (aichat, tgpt, g4f, llm, sgpt)
#  6. Настройка Linux-пространства (Debian/Ubuntu в proot-distro) и системных утилит
# ==============================================================================

set -e

# --- Цветовая палитра ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "=============================================================================="
echo "      🚀 НАСТРОЙКА TERMUX (F-DROID) & ИИ-ПРОСТРАНСТВА (CLAUDE + LINUX)        "
echo "=============================================================================="
echo -e "${RESET}"

# --- 1. Определение окружения (Termux или Linux) ---
IS_TERMUX=false
if [ -d "/data/data/com.termux/files/usr" ] || [[ "$PREFIX" == *"com.termux"* ]]; then
    IS_TERMUX=true
elif [ -n "$TERMUX_VERSION" ]; then
    IS_TERMUX=true
fi

if [ "$IS_TERMUX" = true ]; then
    echo -e "${GREEN}[INFO] Обнаружено окружение Termux (Android).${RESET}"
    BIN_DIR="$PREFIX/bin"
    HOME_DIR="$HOME"
    SYS_UPDATE_CMD="pkg update -y && pkg upgrade -y"
    # Решение ошибки maturin ("Failed to determine Android API level") для сборки Rust-пакетов
    SDK_VER=$(getprop ro.build.version.sdk 2>/dev/null || echo 28)
    export ANDROID_API_LEVEL="${ANDROID_API_LEVEL:-$SDK_VER}"
    export CARGO_BUILD_TARGET_DIR="$PREFIX/tmp/cargo_target"
    export TMPDIR="$PREFIX/tmp"
else
    echo -e "${YELLOW}[INFO] Обнаружено стандартное Linux-окружение.${RESET}"
    BIN_DIR="/usr/local/bin"
    if [ ! -w "$BIN_DIR" ]; then
        BIN_DIR="$HOME/.local/bin"
        mkdir -p "$BIN_DIR"
    fi
    HOME_DIR="$HOME"
    SYS_UPDATE_CMD="sudo apt-get update -y && sudo apt-get upgrade -y || apt-get update -y && apt-get upgrade -y"
fi

# Убедимся, что BIN_DIR находится в PATH пользователя
for rc_file in "$HOME_DIR/.bashrc" "$HOME_DIR/.profile" "$HOME_DIR/.zshrc"; do
    if [ -f "$rc_file" ]; then
        if ! grep -q "$BIN_DIR" "$rc_file" 2>/dev/null; then
            echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$rc_file"
        fi
    else
        echo "export PATH=\"$BIN_DIR:\$PATH\"" > "$rc_file"
    fi
done
export PATH="$BIN_DIR:$PATH"

echo -e "${BLUE}[1/8] Обновление пакетов и базовой системы...${RESET}"
if [ "$IS_TERMUX" = true ]; then
    pkg update -y || true
    pkg upgrade -y -o Dpkg::Options::="--force-confnew" || true
else
    if command -v apt-get >/dev/null 2>&1; then
        if [ "$(id -u)" -eq 0 ]; then
            apt-get update -y && apt-get install -y sudo || true
        else
            sudo apt-get update -y || true
        fi
    fi
fi

# --- Функция установки пакетов с fallback ---
install_pkgs() {
    echo -e "${CYAN} -> Установка пакетов: $*${RESET}"
    for pkg in "$@"; do
        if [ "$IS_TERMUX" = true ]; then
            pkg install -y "$pkg" || echo -e "${YELLOW}[WARN] Пакет $pkg не найден в репозиториях Termux, пропускаем.${RESET}"
        else
            if [ "$(id -u)" -eq 0 ]; then
                apt-get install -y "$pkg" || echo -e "${YELLOW}[WARN] Пакет $pkg не установлен.${RESET}"
            else
                sudo apt-get install -y "$pkg" || echo -e "${YELLOW}[WARN] Пакет $pkg не установлен.${RESET}"
            fi
        fi
    done
}

# --- Функция быстрой установки Python пакетов без долгой компиляции Rust/C++ ---
safe_pip_install() {
    for pkg in "$@"; do
        echo -e "${CYAN} -> Установка Python пакета: $pkg...${RESET}"
        # 1. Сначала пытаемся установить готовый бинарник (wheel / pure python), это занимает 1-2 секунды!
        if pip3 install --upgrade --only-binary=:all: "$pkg" 2>/dev/null || pip install --upgrade --only-binary=:all: "$pkg" 2>/dev/null; then
            echo -e "${GREEN}   ✅ $pkg установлен (быстрый бинарный пакет).${RESET}"
        # 2. Если нет бинарника, для тяжелых Rust-пакетов (duckduckgo-search, anthropic) в Termux пропускаем долгую сборку
        elif [ "$IS_TERMUX" = true ] && [[ "$pkg" == "duckduckgo-search" || "$pkg" == "anthropic" ]]; then
            echo -e "${YELLOW}   ⚡ [INFO] Пакет $pkg пропущен (требует 15 минут сборки Rust на Android Python 3.14).${RESET}"
        # 3. Для остальных быстрых пакетов пробуем обычную установку
        else
            pip3 install --upgrade "$pkg" 2>/dev/null || pip install --upgrade "$pkg" 2>/dev/null || echo -e "${YELLOW}   [WARN] Пакет $pkg пропущен.${RESET}"
        fi
    done
}

# --- 2. Установка базовых утилит и инструментов ---
echo -e "${BLUE}[2/8] Установка базовых утилит и линукс-окружения...${RESET}"
install_pkgs git curl wget nano vim tmux htop tar zip unzip gzip p7zip jq openssh fzf tree sed grep bc less make cmake

if [ "$IS_TERMUX" = true ]; then
    echo -e "${CYAN} -> Установка proot и proot-distro для создания Linux-пространства с root-правами...${RESET}"
    install_pkgs proot proot-distro ncurses-utils termux-api
fi

# --- 3. Установка языков программирования ---
echo -e "${BLUE}[3/8] Установка языков программирования (Python, Node.js, Go, Rust, C/C++, Ruby, PHP, Perl)...${RESET}"
if [ "$IS_TERMUX" = true ]; then
    install_pkgs python python-pip nodejs golang rust clang gdb ruby php perl openjdk-17
else
    install_pkgs python3 python3-pip python3-venv nodejs npm golang rustc cargo build-essential clang gdb ruby php perl default-jdk
fi

# Настройка Python pip
echo -e "${CYAN} -> Настройка Python pip и виртуальных окружений...${RESET}"
if command -v pip3 >/dev/null 2>&1; then
    pip3 install --upgrade pip setuptools wheel || true
elif command -v pip >/dev/null 2>&1; then
    pip install --upgrade pip setuptools wheel || true
fi

# --- 4. Установка браузеров и веб-инструментов ---
echo -e "${BLUE}[4/8] Установка веб-браузеров (w3m, lynx) и библиотек парсинга для ИИ...${RESET}"
install_pkgs w3m lynx elinks

# Установка Python-библиотек для работы с сайтами и вкладками
echo -e "${CYAN} -> Установка библиотек web-скрейпинга (beautifulsoup4, requests, html2text)...${RESET}"
safe_pip_install beautifulsoup4 requests html2text readability-lxml duckduckgo-search

# Установка нашего мультивкладочного консольного браузера ai-browser
AI_BROWSER_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/ai_browser.py"
if [ -f "$AI_BROWSER_SRC" ]; then
    echo -e "${GREEN} -> Установка ai-browser в $BIN_DIR/ai-browser...${RESET}"
    cp "$AI_BROWSER_SRC" "$BIN_DIR/ai-browser"
    chmod +x "$BIN_DIR/ai-browser"
else
    echo -e "${YELLOW} -> Cкачивание ai-browser из репозитория...${RESET}"
    curl -sSL "https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/scripts/ai_browser.py" -o "$BIN_DIR/ai-browser" 2>/dev/null || \
    curl -sSL "https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/main/scripts/ai_browser.py" -o "$BIN_DIR/ai-browser" || true
    if [ -f "$BIN_DIR/ai-browser" ]; then
        chmod +x "$BIN_DIR/ai-browser"
    fi
fi

# --- 5. Создание отдельной рабочей папки с root-правами (Claude Workspace) ---
echo -e "${BLUE}[5/8] Создание отдельной рабочей папки с root-правами для Claude ($HOME_DIR/claude_workspace)...${RESET}"
WORKSPACE_DIR="$HOME_DIR/claude_workspace"
mkdir -p "$WORKSPACE_DIR"
mkdir -p "$WORKSPACE_DIR/projects"
mkdir -p "$WORKSPACE_DIR/scripts"
mkdir -p "$WORKSPACE_DIR/downloads"

# Создаем удобный симлинк
ln -sfn "$WORKSPACE_DIR" "$HOME_DIR/ai_workspace"

# Создаем скрипт claude-root и root-workspace для виртуального root в Termux (proot -0)
cat << 'EOF' > "$BIN_DIR/root-workspace"
#!/usr/bin/env bash
# Запуск терминала или команды с виртуальными правами ROOT в рабочей папке
WORKSPACE_DIR="$HOME/claude_workspace"
mkdir -p "$WORKSPACE_DIR"
cd "$WORKSPACE_DIR"

if command -v proot >/dev/null 2>&1; then
    if [ "$#" -eq 0 ]; then
        echo -e "\033[1;32m[ROOT WORKSPACE] Вход с виртуальными правами uid=0 (root) в $WORKSPACE_DIR\033[0m"
        exec proot -0 -w "$WORKSPACE_DIR" -b "$WORKSPACE_DIR:/root/workspace" bash
    else
        exec proot -0 -w "$WORKSPACE_DIR" "$@"
    fi
else
    echo -e "\033[1;33m[WARN] proot не найден, выполняем команду в обычном режиме в $WORKSPACE_DIR\033[0m"
    exec bash "$@"
fi
EOF
chmod +x "$BIN_DIR/root-workspace"

# --- 6. Настройка Linux-пространства (Debian в proot-distro) ---
echo -e "${BLUE}[6/8] Настройка полноценного Linux-пространства (Debian/Ubuntu) для root-операций...${RESET}"
if [ "$IS_TERMUX" = true ] && command -v proot-distro >/dev/null 2>&1; then
    echo -e "${CYAN} -> Установка дистрибутива debian через proot-distro...${RESET}"
    proot-distro install debian || echo -e "${YELLOW}[INFO] Дистрибутив debian уже установлен или требует настройки.${RESET}"
    
    # Создаем скрипт-оболочку для входа в Linux-пространство как root
    cat << 'EOF' > "$BIN_DIR/linux-space"
#!/usr/bin/env bash
# Вход в полноценное Linux-пространство Debian как ROOT (с монтированием claude_workspace)
WORKSPACE_DIR="$HOME/claude_workspace"
mkdir -p "$WORKSPACE_DIR"
echo -e "\033[1;36m[LINUX SPACE] Запуск Debian Linux с правами ROOT. Ваша рабочая папка смонтирована в /root/workspace\033[0m"
exec proot-distro login debian --bind "$WORKSPACE_DIR:/root/workspace" --bind "$HOME:/home/termux" -- /bin/bash -c "cd /root/workspace && bash"
EOF
    chmod +x "$BIN_DIR/linux-space"
    echo -e "${GREEN} -> Команда 'linux-space' создана! Запустите 'linux-space' для входа в Linux root.${RESET}"
fi

# --- 7. Установка Claude и ИИ-инструментов ---
echo -e "${BLUE}[7/8] Установка Claude (@anthropic-ai/claude-code) и ИИ-инструментов...${RESET}"
if [ "$IS_TERMUX" = true ] && command -v proot-distro >/dev/null 2>&1; then
    echo -e "${CYAN} -> Установка Node.js и Claude Code внутри Debian GNU/Linux (где бинарники glibc работают на 100%)...${RESET}"
    proot-distro login debian -- apt-get update -y || true
    proot-distro login debian -- apt-get install -y curl wget git ca-certificates nodejs npm build-essential || true
    proot-distro login debian -- bash -c "npm config set allow-scripts=@anthropic-ai/claude-code --location=user 2>/dev/null; npm install -g --allow-scripts=@anthropic-ai/claude-code @anthropic-ai/claude-code || npm install -g @anthropic-ai/claude-code" || true
elif command -v npm >/dev/null 2>&1; then
    echo -e "${CYAN} -> Установка официального CLI Claude (@anthropic-ai/claude-code)...${RESET}"
    npm config set allow-scripts=@anthropic-ai/claude-code --location=user 2>/dev/null || true
    npm install -g --allow-scripts=@anthropic-ai/claude-code @anthropic-ai/claude-code || npm install -g @anthropic-ai/claude-code || echo -e "${YELLOW}[WARN] Не удалось установить @anthropic-ai/claude-code через npm.${RESET}"
fi

echo -e "${CYAN} -> Установка Python SDK и утилит для Claude (anthropic, g4f, llm, shell-gpt)...${RESET}"
safe_pip_install anthropic g4f llm shell-gpt

# Копируем бесплатный ИИ-ассистент ai_coder.py в рабочую папку
AI_CODER_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ai_coder.py"
if [ -f "$AI_CODER_SRC" ]; then
    cp "$AI_CODER_SRC" "$WORKSPACE_DIR/ai_coder.py"
else
    curl -sSL "https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/ai_coder.py" -o "$WORKSPACE_DIR/ai_coder.py" 2>/dev/null || \
    curl -sSL "https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/main/ai_coder.py" -o "$WORKSPACE_DIR/ai_coder.py" || true
fi

# Создаем умный скрипт-обертку 'claude' для запуска в Debian GNU/Linux
cat << 'EOF' > "$BIN_DIR/claude"
#!/usr/bin/env bash
# Умный запуск Claude Code через Debian Linux proot (где бинарники glibc работают без ошибок)
if [ -f "$HOME/.config/claude_provider.env" ]; then
    source "$HOME/.config/claude_provider.env"
fi
if command -v proot-distro >/dev/null 2>&1 && proot-distro list 2>/dev/null | grep -q "debian"; then
    WORKSPACE_DIR="$HOME/claude_workspace"
    mkdir -p "$WORKSPACE_DIR"
    exec proot-distro login debian \
        --bind "$HOME:/home/termux" \
        --bind "$HOME/.config:/root/.config" \
        --bind "$WORKSPACE_DIR:/root/workspace" \
        -- /bin/bash -c "source /root/.config/claude_provider.env 2>/dev/null; cd \"$PWD\" 2>/dev/null || cd /root/workspace; exec claude \"\$@\"" -- "$@"
elif [ -f "$PREFIX/lib/node_modules/@anthropic-ai/claude-code/cli.mjs" ]; then
    exec node "$PREFIX/lib/node_modules/@anthropic-ai/claude-code/cli.mjs" "$@"
else
    echo -e "\033[1;31m❌ Ошибка: Claude Code не найден. Выполните: fix_claude.sh\033[0m"
    exit 1
fi
EOF
chmod +x "$BIN_DIR/claude"

# Создаем скрипт-обертку claude-ai
cat << 'EOF' > "$BIN_DIR/claude-ai"
#!/usr/bin/env bash
# Запуск Claude Code или fallback на ai_coder.py
if command -v claude >/dev/null 2>&1; then
    exec claude "$@"
elif [ -f "$HOME/claude_workspace/ai_coder.py" ]; then
    echo -e "\033[1;33m[INFO] Используется бесплатный ИИ-ассистент (g4f).\033[0m"
    exec python3 "$HOME/claude_workspace/ai_coder.py" "$@"
else
    echo -e "\033[1;33m[INFO] Команда 'claude' еще не установлена.\033[0m"
fi
EOF
chmod +x "$BIN_DIR/claude-ai"

# Создаем скрипт-обертку claude-root для запуска в root рабочей папке
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
if command -v proot-distro >/dev/null 2>&1; then
    exec proot-distro login debian \
        --bind "$HOME:/home/termux" \
        --bind "$HOME/.config:/root/.config" \
        --bind "$WORKSPACE_DIR:/root/workspace" \
        -- /bin/bash -c "source /root/.config/claude_provider.env 2>/dev/null; cd /root/workspace && exec claude \"\$@\"" -- "$@"
else
    cd "$WORKSPACE_DIR"
    exec claude "$@"
fi
EOF
chmod +x "$BIN_DIR/claude-root"

# Устанавливаем утилиту claude-key для смены и удаления ключей провайдеров
CLAUDE_SWITCH_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/claude_switch.sh"
if [ -f "$CLAUDE_SWITCH_SRC" ]; then
    cp "$CLAUDE_SWITCH_SRC" "$BIN_DIR/claude-key"
else
    curl -sSL "https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/scripts/claude_switch.sh" -o "$BIN_DIR/claude-key" 2>/dev/null || \
    curl -sSL "https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/main/scripts/claude_switch.sh" -o "$BIN_DIR/claude-key" || true
fi
if [ -f "$BIN_DIR/claude-key" ]; then
    chmod +x "$BIN_DIR/claude-key"
    ln -sf "$BIN_DIR/claude-key" "$BIN_DIR/claude-switch"
    ln -sf "$BIN_DIR/claude-key" "$BIN_DIR/ai-key"
fi

# --- 8. Установка аналогов Claude и ChatGPT для Linux ---
echo -e "${BLUE}[8/8] Установка аналогов Claude и ChatGPT для Linux (aichat, tgpt, g4f, llm, sgpt)...${RESET}"

# 8.1 Установка aichat (универсальный ИИ-чат для Linux/Termux: GPT-4, Claude, Gemini, Ollama)
if [ "$IS_TERMUX" = true ]; then
    pkg install -y aichat || echo -e "${YELLOW}[INFO] aichat будет доступен через cargo install aichat.${RESET}"
fi

# 8.2 Установка tgpt (Terminal GPT — бесплатный ИИ без API ключа)
echo -e "${CYAN} -> Установка tgpt (Terminal GPT — бесплатный ИИ в консоли)...${RESET}"
ARCH=$(uname -m)
if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    TGPT_ARCH="arm64"
elif [ "$ARCH" = "x86_64" ]; then
    TGPT_ARCH="amd64"
else
    TGPT_ARCH="arm64"
fi
curl -sSL "https://github.com/aarnphm/tgpt/releases/latest/download/tgpt-linux-$TGPT_ARCH" -o "$BIN_DIR/tgpt" 2>/dev/null && chmod +x "$BIN_DIR/tgpt" || echo -e "${YELLOW}[INFO] tgpt можно запустить через curl или установить позже.${RESET}"

# 8.3 Создание единого меню управления ИИ-ассистентами: ai-tools
cat << 'EOF' > "$BIN_DIR/ai-tools"
#!/usr/bin/env bash
# Единый интерфейс запуска ИИ-ассистентов в Termux и Linux
echo -e "\033[1;36m============================================================\033[0m"
echo -e "\033[1;36m      🤖 ИИ-АССИСТЕНТЫ ДЛЯ TERMUX & LINUX (AI TOOLS)      \033[0m"
echo -e "\033[1;36m============================================================\033[0m"
echo "  1) claude-root    — Claude Code в рабочей папке с правами root"
echo "  2) ai-browser     — Мультивкладочный браузер для ИИ (сохранение в Markdown)"
echo "  3) linux-space    — Вход в полноценный Debian Linux (proot-distro root)"
echo "  4) root-workspace — Терминал с виртуальными правами root (proot -0)"
echo "  5) aichat         — Универсальный CLI чат (OpenAI, Claude, Ollama, Gemini)"
echo "  6) tgpt           — Бесплатный ИИ-чат в консоли (без API-ключа)"
echo "  7) g4f            — Бесплатный GPT-4 / ChatGPT (Python-библиотека)"
echo "  8) sgpt           — Shell GPT для генерации bash-команд"
echo -e "\033[1;36m============================================================\033[0m"

if [ -n "$1" ]; then
    CMD="$1"
    shift
    exec "$CMD" "$@"
fi
EOF
chmod +x "$BIN_DIR/ai-tools"

# --- Создание подробной инструкции в claude_workspace ---
cat << 'EOF' > "$WORKSPACE_DIR/README_WORKSPACE.md"
# 🤖 Claude Root Workspace & Termux AI Space

Добро пожаловать в выделенную рабочую папку для Claude и ИИ-ассистентов!

## 🔐 Права ROOT и Линукс-пространство
В этой папке вы и Claude можете распоряжаться файлами и устанавливать пакеты:

1. **`claude-root`** — запускает Claude с виртуальными правами root (`uid=0`) в этой директории.
2. **`root-workspace`** — открывает терминал bash с правами root (`proot -0`) в папке `~/claude_workspace`.
3. **`linux-space`** — входит в полноценное Linux-пространство (Debian) под пользователем `root`. Ваша папка смонтирована по пути `/root/workspace`.

## 🌐 Браузер для Claude со вкладками (`ai-browser`)
Используйте команду `ai-browser` для работы со вкладками и сайтами:
- `ai-browser open <url>` — открыть сайт в новой вкладке и перевести в чистый Markdown для ИИ.
- `ai-browser list` — показать все открытые вкладки.
- `ai-browser read <id>` — прочитать текст вкладки.
- `ai-browser links <id>` — показать все гиперссылки на странице.
- `ai-browser search "<запрос>"` — поиск в интернете.
- `ai-browser close <id>` / `ai-browser clear` — управление вкладками.

## 🛠 Установленные языки программирования
- **Python**: `python3`, `pip3`, `venv`
- **Node.js**: `node`, `npm`, `npx`
- **Go**: `go`
- **Rust**: `rustc`, `cargo`
- **C/C++**: `clang`, `gcc`, `make`, `cmake`, `gdb`
- **Ruby, PHP, Perl, Java**: готовы к использованию.

## 🤖 Доступные ИИ-ассистенты (`ai-tools`)
Введите `ai-tools` для просмотра списка всех доступных ассистентов:
- `claude` / `claude-root` (Anthropic Claude Code)
- `aichat` (Универсальный CLI)
- `tgpt` (Бесплатный терминальный GPT)
- `g4f` (GPT4Free)
- `sgpt` (Shell GPT)
EOF

echo -e "${GREEN}${BOLD}"
echo "=============================================================================="
echo "    ✅ УСТАНОВКА И НАСТРОЙКА TERMUX И ИИ-ПРОСТРАНСТВА УСПЕШНО ЗАВЕРШЕНА!      "
echo "=============================================================================="
echo -e "${RESET}"
echo -e "${CYAN}Доступные новые команды в вашем терминале:${RESET}"
echo -e "  🔥 ${BOLD}claude-root${RESET}    — запустить Claude с правами root в рабочей папке"
echo -e "  🌐 ${BOLD}ai-browser${RESET}     — открыть браузер со вкладками для ИИ (ai-browser --help)"
echo -e "  🐧 ${BOLD}linux-space${RESET}    — войти в полноценное Linux-пространство (Debian root)"
echo -e "  🛡️  ${BOLD}root-workspace${RESET} — терминал с виртуальным root (proot -0) в ~/claude_workspace"
echo -e "  🤖 ${BOLD}ai-tools${RESET}       — меню всех установленных ИИ-ассистентов (tgpt, aichat, g4f)"
echo ""
echo -e "${YELLOW}Рабочая папка с правами root: ${BOLD}$WORKSPACE_DIR${RESET}"
echo -e "${GREEN}Для начала работы просто введите: ${BOLD}ai-tools${RESET} или ${BOLD}claude-root${RESET}"
echo "=============================================================================="
