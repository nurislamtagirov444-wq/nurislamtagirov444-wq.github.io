# AI App Manager & Termux AI Space

Приложение для Android, набор утилит для разработки и комплексное ИИ-окружение для Termux (F-Droid) и Linux.

---

## 🚀 Настройка пустого Termux (с F-Droid) и ИИ-пространства (`setup_termux.sh`)

Для автоматического превращения пустого **Termux (с F-Droid)** в мощную среду разработки с ИИ-ассистентами и правами **ROOT в изолированной рабочей папке**, мы создали скрипт **[`setup_termux.sh`](./setup_termux.sh)**.

### Установка в одну команду

**Прямо сейчас (для текущей рабочей ветки):**
```bash
curl -sSL https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/setup_termux.sh | bash
```

*(Альтернативная ссылка для ветки main после слияния):*
```bash
curl -sSL https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/main/setup_termux.sh | bash
```

### Что делает скрипт:
1. **Устанавливает Claude**: подключает официальный CLI `@anthropic-ai/claude-code`, Python SDK, а также создает удобные команды `claude-ai` и `claude-root`.  
   *(Если в Termux возникает ошибка `claude native binary not installed`, выполните `curl -sSL https://raw.githubusercontent.com/nurislamtagirov444-wq/nurislamtagirov444-wq.github.io/arena/019fbdb7-nurislamtagirov444-wq-github-i/fix_claude.sh | bash` для запуска в среде Debian Linux)*.
2. **Дает права ROOT в отдельной рабочей папке**:
   - Создает директорию `~/claude_workspace` (`~/ai_workspace`).
   - Команда `root-workspace` и `claude-root` запускают процессы с виртуальными правами `uid=0` (`proot -0`), позволяя устанавливать и изменять любые файлы в этой папке.
   - Команда `linux-space` запускает полноценный **Debian Linux** под пользователем `root` (`proot-distro`), куда монтируется ваша рабочая папка.
3. **Управление провайдерами и смена/удаление ключа (`claude-key`)**:
   - Команда **`claude-key`** (`claude-switch`, `ai-key`) позволяет в одну строку сменить или удалить прошлые ключи, URL провайдера и модель:  
     `claude-key https://seekai.cc/v1 sk-ключ claude-3-5-sonnet-20241022`
   - Команда `claude-key clear` полностью удаляет старые ключи из памяти и конфигурации.
4. **Скачивает языки программирования**: устанавливает **Python, Node.js, Go, Rust, C / C++ (clang, gcc, make, cmake, gdb), Ruby, PHP, Perl и Java**.
5. **Устанавливает браузер со вкладками для Claude (`ai-browser`)**:
   - Специальный консольный браузер **`ai-browser`**, который умеет открывать сайты во вкладках, конвертировать HTML в чистый Markdown для анализа ИИ, искать в DuckDuckGo и извлекать ссылки.
   - Примеры: `ai-browser open <url>`, `ai-browser list`, `ai-browser read 1`, `ai-browser search "запрос"`.
   - Дополнительно устанавливаются текстовые браузеры `w3m`, `lynx` и библиотеки скрейпинга (`beautifulsoup4`, `requests`, `html2text`).
6. **Устанавливает аналоги Claude и ChatGPT для Linux (`ai-tools`)**:
   - **`aichat`** — универсальный CLI-чат на Rust (OpenAI GPT-4, Claude, Gemini, Ollama, Groq).
   - **`tgpt` (Terminal GPT)** — бесплатный ИИ-чат в консоли **без API-ключа**.
   - **`g4f`** — бесплатные модели GPT-4 / ChatGPT / Claude через Python.
   - **`sgpt` (Shell GPT)** — генератор bash-команд и скриптов.
   - Команда `ai-tools` открывает интерактивное меню всех ассистентов.
7. **Настраивает Linux-пространство и пакеты**: устанавливает полный набор утилит (`git`, `curl`, `wget`, `tmux`, `htop`, `jq`, `fzf`, `tree`, `zsh` и др.).

Подробное руководство читайте в документе: **[TERMUX_AI_GUIDE.md](./TERMUX_AI_GUIDE.md)**.

---

## Бесплатный ИИ-помощник программиста (ai_coder.py)

В этот репозиторий добавлен бесплатный ИИ-ассистент, который может писать для вас код, находить ошибки и объяснять архитектуру. Он работает на базе библиотеки `g4f` (использует GPT-4 / ChatGPT бесплатно через публичные провайдеры).

**Как использовать на вашем компьютере:**
1. Убедитесь, что у вас установлен Python.
2. Установите зависимости: `pip install -r requirements.txt`
3. Запустите ассистента через терминал:
   ```bash
   python ai_coder.py "Напиши функцию на JavaScript для сортировки массива"
   ```

*(Примечание: Скрипт требует доступа в интернет для соединения с серверами ИИ).*

---

## Сборка Android APK (AI App Manager)

К сожалению, из-за ограничений разрешений бота GitHub (отсутствует разрешение `workflows`), я не могу напрямую создать автоматическую сборку APK на серверах GitHub. 

Однако, весь код приложения для управления и анализа статистики уже написан и загружен в репозиторий. 

Чтобы получить APK:
1. Скопируйте файл `build_instructions/build.yml` в папку `.github/workflows/build.yml` в вашем репозитории.
2. Сделайте коммит и отправьте изменения (push).
3. GitHub Actions автоматически запустит сборку приложения.
4. После завершения сборки во вкладке "Actions" появится артефакт `app-debug.apk`, который можно будет скачать по прямой ссылке!

Либо вы можете открыть проект в Android Studio (папка `AIAppManager`) и нажать "Build -> Build Bundle(s) / APK(s) -> Build APK(s)", чтобы скомпилировать его локально.
