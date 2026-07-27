.PHONY: setup format lint

setup:
	@echo "Установка зависимостей Node.js..."
	npm install
	@echo "Установка зависимостей Python..."
	python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt || pip install g4f black ruff

format:
	@echo "Форматирование кода..."
	npx prettier --write .
	source .venv/bin/activate && black . || echo "Black не установлен"

lint:
	@echo "Анализ кода..."
	npx eslint . --fix
	source .venv/bin/activate && ruff check . || echo "Ruff не установлен"

run-ai:
	source .venv/bin/activate && python ai_coder.py
