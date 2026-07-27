import subprocess
import g4f

def get_git_diff():
    # Получаем изменения, которые еще не закоммичены
    result = subprocess.run(['git', 'diff'], capture_output=True, text=True)
    return result.stdout

def review_code():
    diff = get_git_diff()
    if not diff.strip():
        print("✅ Нет несохраненных изменений для ревью. Код чист!")
        return

    print("🤖 ИИ анализирует изменения в коде...\n")
    prompt = f"Ты опытный Senior разработчик. Сделай code review следующих изменений Git. Найди возможные ошибки, проблемы с производительностью или код-стайлом. Будь краток. Ответь на русском.\n\nИзменения:\n{diff[:3000]}"
    
    try:
        response = g4f.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        print("💡 [AI Code Review Result]:\n")
        for chunk in response:
            print(chunk, end="", flush=True)
        print("\n")
    except Exception as e:
        print(f"❌ Ошибка соединения с ИИ: {e}")

if __name__ == "__main__":
    review_code()
