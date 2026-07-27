.PHONY: setup format lint

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
