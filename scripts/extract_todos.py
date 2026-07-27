import os
import re

def extract_todos(directory="."):
    todos = []
    # Ищем TODO и FIXME в коде
    pattern = re.compile(r'(TODO|FIXME):\s*(.*)', re.IGNORECASE)
    
    for root, _, files in os.walk(directory):
        if ".venv" in root or "node_modules" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith((".py", ".kt", ".js", ".ts", ".xml")):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        for line_num, line in enumerate(f, 1):
                            match = pattern.search(line)
                            if match:
                                todos.append(f"- **{match.group(1)}** в `{path}` (строка {line_num}): {match.group(2)}")
                except:
                    pass

    with open("TODO_REPORT.md", "w", encoding="utf-8") as f:
        f.write("# Отчет по недоделкам (TODO / FIXME)\n\n")
        if todos:
            f.write("\n".join(todos))
        else:
            f.write("🎉 Код чист, недоделок не найдено!")
    print("Отчет сгенерирован в TODO_REPORT.md")

if __name__ == "__main__":
    extract_todos()
