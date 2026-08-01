#!/usr/bin/env bash
# ==============================================================================
# 🔑 CLAUDE-KEY (CLAUDE-SWITCH) — Управление ключами, провайдерами и моделями
# Полное удаление старого ключа и установка нового URL провайдера, ключа и модели.
# Поддерживает Claude Code (@anthropic-ai/claude-code), aichat, g4f и другие утилиты.
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ENV_FILE="$HOME/.config/claude_provider.env"
mkdir -p "$HOME/.config"

# Функция для маскировки ключа при выводе (sk-1234...abcd)
mask_key() {
    local key="$1"
    local len=${#key}
    if [ "$len" -le 8 ]; then
        echo "********"
    else
        local start="${key:0:4}"
        local end="${key: -4}"
        echo "${start}**********${end}"
    fi
}

# 1. Функция полной очистки старого ключа и настроек
clear_old_keys() {
    # 1.1 Удаляем файл окружения
    if [ -f "$ENV_FILE" ]; then
        rm -f "$ENV_FILE"
    fi
    rm -f "$HOME/.claude_env" 2>/dev/null || true

    # 1.2 Удаляем старые прямые экспорты из .bashrc, .profile, .zshrc если они были записаны вручную
    for rc_file in "$HOME/.bashrc" "$HOME/.profile" "$HOME/.zshrc"; do
        if [ -f "$rc_file" ]; then
            sed -i '/export ANTHROPIC_API_KEY=/d' "$rc_file" 2>/dev/null || true
            sed -i '/export ANTHROPIC_BASE_URL=/d' "$rc_file" 2>/dev/null || true
            sed -i '/export ANTHROPIC_MODEL=/d' "$rc_file" 2>/dev/null || true
            sed -i '/export ANTHROPIC_API_URL=/d' "$rc_file" 2>/dev/null || true
            sed -i '/export OPENAI_API_KEY=/d' "$rc_file" 2>/dev/null || true
            sed -i '/export OPENAI_BASE_URL=/d' "$rc_file" 2>/dev/null || true
            sed -i '/export OPENAI_MODEL=/d' "$rc_file" 2>/dev/null || true
        fi
    done

    # 1.3 Сбрасываем переменные в текущем сеансе
    unset ANTHROPIC_API_KEY ANTHROPIC_BASE_URL ANTHROPIC_MODEL ANTHROPIC_API_URL ANTHROPIC_URL 2>/dev/null || true
    unset OPENAI_API_KEY OPENAI_BASE_URL OPENAI_MODEL OPENAI_API_BASE 2>/dev/null || true
}

# --- Обработка команд status / show / list ---
if [ "$1" = "status" ] || [ "$1" = "show" ] || [ "$1" = "list" ]; then
    echo -e "${CYAN}${BOLD}============================================================${RESET}"
    echo -e "${CYAN}${BOLD}       🤖 ТЕКУЩАЯ КОНФИГУРАЦИЯ CLAUDE CODE & AI             ${RESET}"
    echo -e "${CYAN}${BOLD}============================================================${RESET}"
    if [ -f "$ENV_FILE" ]; then
        # Читаем значения из файла
        CUR_URL=$(grep "ANTHROPIC_BASE_URL=" "$ENV_FILE" | head -n1 | cut -d'"' -f2 || cut -d"'" -f2)
        CUR_KEY=$(grep "ANTHROPIC_API_KEY=" "$ENV_FILE" | head -n1 | cut -d'"' -f2 || cut -d"'" -f2)
        CUR_MODEL=$(grep "ANTHROPIC_MODEL=" "$ENV_FILE" | head -n1 | cut -d'"' -f2 || cut -d"'" -f2)
        echo -e " 🌐 URL провайдера : ${BOLD}${CUR_URL:-Не задан}${RESET}"
        echo -e " 🔑 API-ключ       : ${GREEN}$(mask_key "${CUR_KEY}")${RESET}"
        echo -e " 🤖 Модель         : ${CYAN}${CUR_MODEL:-claude-3-5-sonnet-20241022}${RESET}"
    elif [ -n "$ANTHROPIC_API_KEY" ]; then
        echo -e " 🌐 URL провайдера : ${BOLD}${ANTHROPIC_BASE_URL:-https://api.anthropic.com}${RESET}"
        echo -e " 🔑 API-ключ       : ${GREEN}$(mask_key "${ANTHROPIC_API_KEY}")${RESET}"
        echo -e " 🤖 Модель         : ${CYAN}${ANTHROPIC_MODEL:-claude-3-5-sonnet-20241022}${RESET}"
    else
        echo -e "${YELLOW}📭 Активный API-ключ не настроен.${RESET}"
        echo -e "Для установки используйте: ${BOLD}claude-key <URL> <КЛЮЧ> [МОДЕЛЬ]${RESET}"
    fi
    echo -e "${CYAN}============================================================${RESET}"
    exit 0
fi

# --- Обработка команды clear / rm / delete / reset ---
if [ "$1" = "clear" ] || [ "$1" = "rm" ] || [ "$1" = "delete" ] || [ "$1" = "reset" ]; then
    clear_old_keys
    echo -e "${GREEN}${BOLD}🗑️  Все прошлые ключи, URL провайдеров и настройки моделей Claude успешно удалены!${RESET}"
    exit 0
fi

# --- Справка --help или пустые аргументы ---
if [ -z "$1" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ] || [ "$1" = "help" ]; then
    echo -e "${CYAN}${BOLD}============================================================${RESET}"
    echo -e "${CYAN}${BOLD}       🔑 CLAUDE-KEY (СМЕНА И УДАЛЕНИЕ КЛЮЧА CLAUDE)         ${RESET}"
    echo -e "${CYAN}${BOLD}============================================================${RESET}"
    echo -e "${BOLD}Использование:${RESET}"
    echo -e "  claude-key ${CYAN}<URL> <КЛЮЧ> [МОДЕЛЬ]${RESET}    — Сменить URL провайдера, ключ и модель (старый ключ удаляется)"
    echo -e "  claude-key ${YELLOW}clear${RESET}                     — Полностью удалить текущий ключ и сбросить настройки"
    echo -e "  claude-key ${GREEN}status${RESET}                    — Показать текущий активный URL, замаскированный ключ и модель"
    echo ""
    echo -e "${BOLD}Пример использования:${RESET}"
    echo -e "  claude-key https://seekai.cc/v1 sk-your-api-key-here claude-3-5-sonnet-20241022"
    echo -e "${CYAN}============================================================${RESET}"
    exit 0
fi

# ==============================================================================
# УСТАНОВКА НОВОГО URL, КЛЮЧА И МОДЕЛИ (С ПОЛНЫМ УДАЛЕНИЕМ СТАРЫХ)
# ==============================================================================

NEW_URL="$1"
NEW_KEY="$2"
NEW_MODEL="${3:-claude-3-5-sonnet-20241022}"

# Проверка, что ключ передан
if [ -z "$NEW_KEY" ]; then
    echo -e "${RED}${BOLD}❌ Ошибка: вы не указали API-ключ!${RESET}"
    echo -e "${YELLOW}Правильный формат: ${BOLD}claude-key <URL> <КЛЮЧ> [МОДЕЛЬ]${RESET}"
    echo -e "Пример: ${CYAN}claude-key https://seekai.cc/v1 sk-your-key-here claude-3-5-sonnet-20241022${RESET}"
    exit 1
fi

echo -e "${BLUE} -> [1/4] Полное удаление предыдущих ключей и настроек провайдера...${RESET}"
clear_old_keys

echo -e "${BLUE} -> [2/4] Запись нового URL провайдера, ключа и модели...${RESET}"

# Создаем файл окружения с новыми ключами (включая ANTHROPIC_AUTH_TOKEN для совместимости 2026 года)
cat << EOF > "$ENV_FILE"
# ==============================================================================
# Конфигурация провайдера для Claude Code и ИИ-ассистентов
# Сгенерировано командой claude-key $(date '+%Y-%m-%d %H:%M:%S')
# ==============================================================================

# Anthropic / Claude Code настройки
export ANTHROPIC_BASE_URL="${NEW_URL}"
export ANTHROPIC_API_KEY="${NEW_KEY}"
export ANTHROPIC_AUTH_TOKEN="${NEW_KEY}"
export ANTHROPIC_MODEL="${NEW_MODEL}"
export ANTHROPIC_API_URL="${NEW_URL}"
export ANTHROPIC_URL="${NEW_URL}"

# Совместимость с OpenAI-прокси (для aichat, g4f и сторонних ИИ-клиентов)
export OPENAI_BASE_URL="${NEW_URL}"
export OPENAI_API_KEY="${NEW_KEY}"
export OPENAI_MODEL="${NEW_MODEL}"
export OPENAI_API_BASE="${NEW_URL}"
EOF
chmod 600 "$ENV_FILE"

# Если установлен Claude Code CLI, также прописываем в глобальный конфиг claude config set -g
if command -v claude >/dev/null 2>&1; then
    claude config set -g env.ANTHROPIC_BASE_URL "${NEW_URL}" 2>/dev/null || true
    claude config set -g env.ANTHROPIC_API_KEY "${NEW_KEY}" 2>/dev/null || true
    claude config set -g env.ANTHROPIC_AUTH_TOKEN "${NEW_KEY}" 2>/dev/null || true
    claude config set -g model "${NEW_MODEL}" 2>/dev/null || true
fi

# Убедимся, что файл автоматически подгружается во всех оболочках (.bashrc, .profile, .zshrc)
echo -e "${BLUE} -> [3/4] Настройка автоматической загрузки конфигурации в сессии терминала...${RESET}"
LOAD_LINE="[ -f \"\$HOME/.config/claude_provider.env\" ] && source \"\$HOME/.config/claude_provider.env\""
FUNC_LINE="claude-key() { command claude-key \"\$@\"; local ret=\$?; [ -f \"\$HOME/.config/claude_provider.env\" ] && source \"\$HOME/.config/claude_provider.env\" 2>/dev/null; [ -f \"/root/.config/claude_provider.env\" ] && source \"/root/.config/claude_provider.env\" 2>/dev/null; return \$ret; }"

for rc_file in "$HOME/.bashrc" "$HOME/.profile" "$HOME/.zshrc" "/etc/bash.bashrc" "/etc/profile"; do
    if [ -f "$rc_file" ] && [ -w "$rc_file" ]; then
        if ! grep -q "claude_provider.env" "$rc_file" 2>/dev/null; then
            echo "" >> "$rc_file"
            echo "# Автозагрузка ключа и провайдера Claude" >> "$rc_file"
            echo "$LOAD_LINE" >> "$rc_file"
            echo "$FUNC_LINE" >> "$rc_file"
        fi
    elif [ ! -f "$rc_file" ] && [ -w "$(dirname "$rc_file")" ]; then
        echo "# Автозагрузка ключа и провайдера Claude" > "$rc_file"
        echo "$LOAD_LINE" >> "$rc_file"
        echo "$FUNC_LINE" >> "$rc_file"
    fi
done

# Применяем в текущей сессии для проверки
source "$ENV_FILE" 2>/dev/null || true

# --- ОБНОВЛЯЕМ НАСТРОЙКИ В ~/.claude.json и отключение экрана логина ---
echo -e "${BLUE} -> [4/4] Запись конфигурации напрямую в ~/.claude.json и обновление обертки claude...${RESET}"
python3 -c '
import json, os, sys
key = sys.argv[1]
url = sys.argv[2]
model = sys.argv[3]
paths = [
    os.path.expanduser("~/.claude.json"),
    "/root/.claude.json",
    os.path.expanduser("~/.claude/settings.json"),
    "/root/.claude/settings.json",
    os.path.expanduser("~/.config/claude/config.json"),
    "/root/.config/claude/config.json"
]
for p in paths:
    data = {}
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {}
    data.update({
        "primaryApiKey": key,
        "apiKey": key,
        "customApiKey": key,
        "baseUrl": url,
        "apiBaseUrl": url,
        "customBaseUrl": url,
        "model": model,
        "hasCompletedOnboarding": True,
        "onboardingCompleted": True
    })
    try:
        os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception:
        pass
' "$NEW_KEY" "$NEW_URL" "$NEW_MODEL" 2>/dev/null || true

# Создаем умную обертку для команды claude, чтобы она ВСЕГДА загружала ~/.config/claude_provider.env перед запуском
for bin_dir in "/usr/local/bin" "/usr/bin" "$PREFIX/bin" "$HOME/.local/bin"; do
    target_bin="$bin_dir/claude"
    if [ -f "$target_bin" ] && [ -w "$bin_dir" ] && ! grep -q "claude_provider.env" "$target_bin" 2>/dev/null; then
        real_cli=$(readlink -f "$target_bin" 2>/dev/null || true)
        if [ -n "$real_cli" ] && [ "$real_cli" != "$target_bin" ] && [ -f "$real_cli" ]; then
            rm -f "$target_bin"
            cat << WRAPPER_EOF > "$target_bin"
#!/usr/bin/env bash
# Умный запуск Claude Code с автоматической загрузкой API ключей
for env_file in "\$HOME/.config/claude_provider.env" "/root/.config/claude_provider.env" "/home/termux/.config/claude_provider.env"; do
    if [ -f "\$env_file" ]; then
        source "\$env_file" 2>/dev/null || true
    fi
done
export ANTHROPIC_API_KEY ANTHROPIC_BASE_URL ANTHROPIC_MODEL ANTHROPIC_API_URL ANTHROPIC_URL OPENAI_API_KEY OPENAI_BASE_URL OPENAI_MODEL
exec node "$real_cli" "\$@"
WRAPPER_EOF
            chmod +x "$target_bin"
        fi
    fi
done

# Также создаем/обновляем конфигурацию для aichat, если установлена директория aichat
if [ -d "$HOME/.config/aichat" ]; then
    cat << EOF > "$HOME/.config/aichat/config.yaml"
model: openai:${NEW_MODEL}
clients:
  - type: openai
    api_key: "${NEW_KEY}"
    api_base: "${NEW_URL}"
EOF
fi

# --- ИТОГОВОЕ СООБЩЕНИЕ ---
echo -e ""
echo -e "${GREEN}${BOLD}============================================================${RESET}"
echo -e "${GREEN}${BOLD} 🔄 НАСТРОЙКИ CLAUDE CODE ОБНОВЛЕНЫ (ПРОШЛЫЙ КЛЮЧ УДАЛЕН)    ${RESET}"
echo -e "${GREEN}${BOLD}============================================================${RESET}"
echo -e " 🌐 URL провайдера : ${BOLD}${NEW_URL}${RESET}"
echo -e " 🔑 Новый API-ключ : ${GREEN}$(mask_key "${NEW_KEY}")${RESET}"
echo -e " 🤖 Модель         : ${CYAN}${NEW_MODEL}${RESET}"
echo -e "${GREEN}${BOLD}============================================================${RESET}"
echo -e "✅ Прошлые ключи и URL удалены."
echo -e "✅ Новая конфигурация сохранена в: ${BOLD}~/.config/claude_provider.env${RESET}"
echo -e "   (Ключ автоматически активен для Claude Code и ИИ-утилит!)"
echo -e ""
echo -e "${YELLOW}${BOLD}👉 ВАЖНО для текущей сессии:${RESET} чтобы ключ сразу активировался"
echo -e "   в текущей консоли без перезапуска, выполните:"
echo -e "   ${BOLD}${GREEN}source ~/.config/claude_provider.env${RESET}"
echo -e ""
echo -e "${CYAN}Для проверки статуса введите: ${BOLD}claude-key status${RESET}"
echo -e "${YELLOW}Для полного удаления ключа: ${BOLD}claude-key clear${RESET}"
echo -e "${GREEN}============================================================${RESET}"
