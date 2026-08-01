# 🚀 Полноценное ИИ- и Linux-пространство в Termux (F-Droid)

Это руководство объясняет, как запустить и использовать автоматический скрипт настройки **`setup_termux.sh`** для создания мощного рабочего окружения с **Claude Code**, правами **root в отдельной рабочей папке**, языками программирования, мультивкладочным браузером и альтернативными ИИ-ассистентами в чистом **Termux** с F-Droid.

---

## ⚡ 1. Установка в чистый Termux (с F-Droid)

### Шаг 1. Скачайте и установите Termux с F-Droid
> **Важно:** Не используйте версию из Google Play, так как она устарела и не обновляется! Установите Termux с официального сайта [F-Droid](https://f-droid.org/packages/com.termux/).

### Шаг 2. Запустите одну команду установки

**Для текущей рабочей ветки (выполните прямо сейчас в Termux):**
```bash
curl -sSL https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/setup_termux.sh | bash
```

*(Альтернативная ссылка, если вы используете wget):*
```bash
wget -qO- https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/setup_termux.sh | bash
```

*(После слияния в ветку main также будет доступна ссылка с `/main/`):*
```bash
curl -sSL https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/main/setup_termux.sh | bash
```

Скрипт автоматически обновит систему, настроит права, установит языки программирования и подготовит изолированное ИИ-пространство.

> 💡 **Решение ошибки `Error: claude native binary not installed`**:  
> Если при попытке запустить `claude` в Termux вы видите эту ошибку (из-за несовместимости бинарников Android bionic и Linux glibc), выполните команду исправления:  
> ```bash
> curl -sSL https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/fix_claude.sh | bash
> ```  
> Скрипт автоматически установит Claude Code в полноценную среду **Debian GNU/Linux** (`proot-distro`) и создаст умную команду `claude` для Termux!

---

## 🔐 2. Отдельная рабочая папка с правами ROOT для Claude

Скрипт создает для вас и Claude изолированную рабочую директорию по адресу:
`~/claude_workspace` (также доступна по ссылке `~/ai_workspace`).

В этой папке Claude имеет **полные виртуальные права ROOT (`uid=0`)** без необходимости получения реального Root на Android-устройстве. Доступно два режима Root:

### 1) Виртуальный Root в Termux (`proot -0`)
Команда `claude-root` или `root-workspace` запускает процесс с виртуальным `uid=0`. Внутри этой папки Claude может создавать файлы, менять права доступа, устанавливать пакеты Python/Node и распоряжаться файлами без ограничений.

- **Запустить Claude с правами Root:**
  ```bash
  claude-root
  ```
- **Запустить bash-терминал с правами Root:**
  ```bash
  root-workspace
  ```

### 2) Полноценный Linux-дистрибутив Debian/Ubuntu (`proot-distro`)
Скрипт устанавливает дистрибутив **Debian Linux**. Ваша рабочая папка автоматически монтируется внутрь дистрибутива в путь `/root/workspace`.
- **Войти в Linux-пространство под пользователем `root`:**
  ```bash
  linux-space
  ```
- Внутри вы можете использовать `apt update`, `apt install -y <любой-пакет-linux>`, запускать демоны, базы данных и полноценные Linux-приложения.

---

## 🔑 3. Быстрая смена и удаление API-ключей, провайдеров и моделей (`claude-key`)

Для управления провайдером, ключом и моделью в Claude Code (`@anthropic-ai/claude-code`) и сторонних ИИ-утилитах создана короткая команда **`claude-key`** (алиасы `claude-switch`, `ai-key`).

### Основные возможности:
1. **Полное удаление прошлого ключа** при вводе нового (чтобы старые ключи никогда не конфликтовали с новыми).
2. **Установка нового URL провайдера, ключа и модели**:
   ```bash
   claude-key https://seekai.cc/v1 sk-your-api-key claude-3-5-sonnet-20241022
   ```
3. **Проверка текущего статуса и замаскированного ключа**:
   ```bash
   claude-key status
   ```
4. **Полное удаление всех сохраненных ключей и сброс настроек**:
   ```bash
   claude-key clear
   ```

*(Установить только эту команду без перезапуска всей установки можно через `curl -sSL https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/install_key.sh | bash`).*

---

## 🌐 4. Браузер для Claude со вкладками (`ai-browser`)

Для работы с сайтами и вкладками в консоли установлен специальный браузер **`ai-browser`**, который автоматически конвертирует страницы в чистый читаемый **Markdown** для ИИ.

### Основные команды `ai-browser`:
- **Открыть сайт в новой вкладке:**
  ```bash
  ai-browser open https://ru.wikipedia.org/wiki/Linux
  ```
- **Показать список открытых вкладок:**
  ```bash
  ai-browser list
  ```
- **Прочитать текст вкладки (в формате Markdown):**
  ```bash
  ai-browser read 1
  ```
- **Показать все ссылки со страницы во вкладке:**
  ```bash
  ai-browser links 1
  ```
- **Поиск в интернете через DuckDuckGo:**
  ```bash
  ai-browser search "как написать парсер на python"
  ```
- **Закрыть вкладку или очистить сессию:**
  ```bash
  ai-browser close 1
  ai-browser clear
  ```

---

## 🛠 5. Установленные языки программирования

Скрипт автоматически устанавливает и настраивает компиляторы и интерпретаторы:
| Язык | Команды / Инструменты | Назначение |
| --- | --- | --- |
| **Python** | `python3`, `pip3`, `venv` | Автоматизация, ИИ, скрипты, парсинг |
| **Node.js** | `node`, `npm`, `npx` | Работа официального Claude Code и JS/TS |
| **Go (Golang)** | `go` | Быстрые CLI-инструменты и серверы |
| **Rust** | `rustc`, `cargo` | Высокопроизводительные утилиты (aichat и др.) |
| **C / C++** | `clang`, `gcc`, `make`, `cmake`, `gdb` | Компиляция системного кода |
| **Ruby, PHP, Perl** | `ruby`, `php`, `perl` | Веб-разработка и скрипты |
| **Java** | `java`, `javac` (OpenJDK 17) | Разработка Android- и Java-приложений |

---

## 🤖 6. Аналоги Claude и ChatGPT для Linux

Кроме официального Claude, скрипт устанавливает набор мощных альтернативных ИИ-ассистентов для терминала:

### Единое меню ассистентов:
Просто введите команду `ai-tools`, чтобы увидеть интерактивное меню всех установленных нейросетей:

```bash
ai-tools
```

### Доступные инструменты:
1. **`claude-root`** — официальный Claude Code от Anthropic с правами Root в рабочей папке.
2. **`aichat`** — универсальный консольный чат на Rust. Поддерживает модели **OpenAI (GPT-4), Claude, Gemini, Ollama, Groq, Mistral**.
3. **`tgpt` (Terminal GPT)** — бесплатный чат с ИИ прямо в терминале **без необходимости указывать API-ключ**!
4. **`g4f`** — библиотека и CLI GPT4Free для бесплатного доступа к GPT-4 и Claude через Python.
5. **`sgpt` (Shell GPT)** — генератор bash-команд, скриптов и объяснений кода.
6. **`ai_coder.py`** — встроенный ИИ-помощник из этого репозитория.

---

## 📋 Сводная таблица быстрых команд

| Команда | Описание |
| --- | --- |
| `setup_termux.sh` | Главный скрипт автоматической установки и настройки |
| `claude-key` | Управление провайдером, смена/удаление API-ключа (`claude-key <url> <key> [model]`) |
| `claude-root` | Запуск Claude в рабочей папке с виртуальным Root (`uid=0`) |
| `claude-ai` | Запуск Claude или fallback на бесплатный `ai_coder.py` |
| `root-workspace` | Вход в консоль bash с правами Root в папке `~/claude_workspace` |
| `linux-space` | Вход в полноценный дистрибутив Debian Linux под root (`proot-distro`) |
| `ai-browser` | Мультивкладочный консольный браузер с поиском и выгрузкой Markdown |
| `ai-tools` | Вызов меню всех ИИ-ассистентов (aichat, tgpt, g4f, sgpt, claude) |

---
*Создано для автоматизации и эффективной разработки в Termux & Linux (2026).*
