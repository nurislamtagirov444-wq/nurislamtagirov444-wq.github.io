.PHONY: setup format lint build-apk clean

setup:
	@echo "Установка зависимостей Node.js..."
	npm install
	@echo "Установка зависимостей Python..."
	python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt || pip install g4f black ruff

format:
	@echo "Форматирование кода..."
	npx prettier --write .
	. .venv/bin/activate && black . || echo "Black не установлен"

lint:
	@echo "Анализ кода..."
	npx eslint . --fix
	. .venv/bin/activate && ruff check . || echo "Ruff не установлен"

run-ai:
	. .venv/bin/activate && python ai_coder.py

# --- ПРОДВИНУТЫЕ ИНСТРУМЕНТЫ ДЛЯ ИИ И ПОЛЬЗОВАТЕЛЯ ---

audit:
	@echo "🔍 Поиск уязвимостей в коде (Security Scan)..."
	. .venv/bin/activate && bandit -r . -x .venv,node_modules -f custom || echo "Bandit не установлен"

complexity:
	@echo "📈 Анализ сложности кода (Макаронный код?)..."
	. .venv/bin/activate && radon cc . -a -nc || echo "Radon не установлен"

todo:
	@echo "📝 Сбор всех TODO и FIXME в один отчет..."
	. .venv/bin/activate && python scripts/extract_todos.py

mock-api:
	@echo "🚀 Запуск фейкового API сервера на порту 8000..."
	. .venv/bin/activate && uvicorn scripts.mock_api:app --reload

changelog:
	@echo "🕒 Генерация CHANGELOG из истории коммитов..."
	. .venv/bin/activate && python scripts/generate_changelog.py

ai-review:
	@echo "🤖 Запуск ИИ Code Review..."
	. .venv/bin/activate && python scripts/ai_code_review.py

ai-translate:
	@echo "🌍 Запуск ИИ Переводчика интерфейсов..."
	. .venv/bin/activate && python scripts/ai_translator.py "$(LANG)"

# =====================================================================
#  ANDROID APK BUILD
#  Использование: make build-apk
#  Скачивает Android SDK + Gradle, собирает AIAppManager.apk и AnimeNovel.apk
# =====================================================================

GRADLE_VERSION    := 8.0
ANDROID_PLATFORM  := 33
ANDROID_BUILD_TOOLS := 33.0.2
ANDROID_SDK_ROOT  := $(CURDIR)/.android-sdk
CMDLINE_TOOLS_URL := https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
DIST_DIR          := $(CURDIR)/dist

# --- Шаг 1: Скачиваем Gradle ---
.build-tools/gradle-$(GRADLE_VERSION)/bin/gradle:
	@echo "📦 Скачивание Gradle $(GRADLE_VERSION)..."
	@mkdir -p .build-tools
	@curl -fsSL "https://services.gradle.org/distributions/gradle-$(GRADLE_VERSION)-bin.zip" \
		-o .build-tools/gradle.zip
	@unzip -q .build-tools/gradle.zip -d .build-tools
	@rm -f .build-tools/gradle.zip
	@echo "✅ Gradle $(GRADLE_VERSION) готов."

# --- Шаг 2: Скачиваем Android SDK command-line tools ---
$(ANDROID_SDK_ROOT)/cmdline-tools/latest/bin/sdkmanager:
	@echo "📦 Скачивание Android SDK command-line tools..."
	@mkdir -p $(ANDROID_SDK_ROOT)/cmdline-tools
	@curl -fsSL "$(CMDLINE_TOOLS_URL)" -o .build-tools/cmdline-tools.zip
	@unzip -q .build-tools/cmdline-tools.zip -d $(ANDROID_SDK_ROOT)/cmdline-tools
	@mv $(ANDROID_SDK_ROOT)/cmdline-tools/cmdline-tools \
	    $(ANDROID_SDK_ROOT)/cmdline-tools/latest
	@rm -f .build-tools/cmdline-tools.zip
	@echo "✅ Android SDK command-line tools готовы."

# --- Шаг 3: Принимаем лицензии и ставим SDK-компоненты ---
.PHONY: _install-sdk
_install-sdk: $(ANDROID_SDK_ROOT)/cmdline-tools/latest/bin/sdkmanager
	@echo "📜 Принятие лицензий Android SDK..."
	@yes | $(ANDROID_SDK_ROOT)/cmdline-tools/latest/bin/sdkmanager \
		--sdk_root=$(ANDROID_SDK_ROOT) --licenses > /dev/null 2>&1 || true
	@echo "📲 Установка SDK: platform-tools, android-$(ANDROID_PLATFORM), build-tools $(ANDROID_BUILD_TOOLS)..."
	@$(ANDROID_SDK_ROOT)/cmdline-tools/latest/bin/sdkmanager \
		--sdk_root=$(ANDROID_SDK_ROOT) \
		"platform-tools" \
		"platforms;android-$(ANDROID_PLATFORM)" \
		"build-tools;$(ANDROID_BUILD_TOOLS)"
	@echo "✅ Android SDK установлен."

# --- Шаг 4: Генерируем gradlew-обёртки через временный проект ---
.PHONY: _generate-wrappers
_generate-wrappers: .build-tools/gradle-$(GRADLE_VERSION)/bin/gradle
	@echo "🔧 Генерация Gradle wrapper'ов..."
	@mkdir -p .build-tools/temp-project
	@echo 'rootProject.name = "temp"' > .build-tools/temp-project/settings.gradle
	@cd .build-tools/temp-project && \
		../gradle-$(GRADLE_VERSION)/bin/gradle wrapper \
			--gradle-version $(GRADLE_VERSION) --quiet 2>/dev/null
	@for proj in AIAppManager AnimeNovelApp; do \
		mkdir -p $$proj/gradle/wrapper && \
		cp .build-tools/temp-project/gradlew $$proj/gradlew && \
		cp .build-tools/temp-project/gradlew.bat $$proj/gradlew.bat && \
		cp .build-tools/temp-project/gradle/wrapper/gradle-wrapper.jar \
		   $$proj/gradle/wrapper/gradle-wrapper.jar && \
		cp .build-tools/temp-project/gradle/wrapper/gradle-wrapper.properties \
		   $$proj/gradle/wrapper/gradle-wrapper.properties && \
		chmod +x $$proj/gradlew; \
	done
	@echo "✅ Wrapper'ы сгенерированы для AIAppManager и AnimeNovelApp."

# --- Шаг 5: Собираем APK ---
.PHONY: build-apk
build-apk: _install-sdk _generate-wrappers
	@echo ""
	@echo "=========================================="
	@echo "  🛠  Сборка Android APK"
	@echo "=========================================="
	@mkdir -p $(DIST_DIR)
	@echo ""
	@echo "▶ Сборка AIAppManager..."
	@ANDROID_SDK_ROOT=$(ANDROID_SDK_ROOT) ANDROID_HOME=$(ANDROID_SDK_ROOT) \
		./AIAppManager/gradlew -p AIAppManager assembleDebug --no-daemon --quiet
	@cp AIAppManager/app/build/outputs/apk/debug/app-debug.apk \
	    $(DIST_DIR)/AIAppManager.apk
	@echo "✅ AIAppManager.apk готов"
	@echo ""
	@echo "▶ Сборка AnimeNovel..."
	@ANDROID_SDK_ROOT=$(ANDROID_SDK_ROOT) ANDROID_HOME=$(ANDROID_SDK_ROOT) \
		./AnimeNovelApp/gradlew -p AnimeNovelApp assembleDebug --no-daemon --quiet
	@cp AnimeNovelApp/app/build/outputs/apk/debug/app-debug.apk \
	    $(DIST_DIR)/AnimeNovel.apk
	@echo "✅ AnimeNovel.apk готов"
	@echo ""
	@echo "=========================================="
	@echo "  📱 APK файлы собраны в папке dist/"
	@echo "     - $(DIST_DIR)/AIAppManager.apk"
	@echo "     - $(DIST_DIR)/AnimeNovel.apk"
	@echo "=========================================="

# --- Очистка скачанных инструментов ---
clean:
	@echo "🧹 Очистка..."
	rm -rf .build-tools .android-sdk dist
	@echo "✅ Готово."
