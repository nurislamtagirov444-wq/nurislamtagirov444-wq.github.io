import subprocess

def generate_changelog():
    try:
        # Получаем последние 10 коммитов
        result = subprocess.run(['git', 'log', '-10', '--pretty=format:- %s (%h)'], capture_output=True, text=True)
        commits = result.stdout
        
        with open("CHANGELOG.md", "w", encoding="utf-8") as f:
            f.write("# История изменений (Changelog)\n\n")
            f.write("## Последние обновления\n")
            f.write(commits)
        print("Changelog успешно обновлен!")
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    generate_changelog()
