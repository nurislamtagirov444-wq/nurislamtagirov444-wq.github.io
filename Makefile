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
	source .venv/bin/activate && bandit -r . -x .venv,node_modules -f custom || echo "Bandit не установлен"

complexity:
	@echo "📈 Анализ сложности кода (Макаронный код?)..."
	source .venv/bin/activate && radon cc . -a -nc || echo "Radon не установлен"

todo:
	@echo "📝 Сбор всех TODO и FIXME в один отчет..."
	source .venv/bin/activate && python scripts/extract_todos.py

mock-api:
	@echo "🚀 Запуск фейкового API сервера на порту 8000..."
	source .venv/bin/activate && uvicorn scripts.mock_api:app --reload

changelog:
	@echo "🕒 Генерация CHANGELOG из истории коммитов..."
	source .venv/bin/activate && python scripts/generate_changelog.py
