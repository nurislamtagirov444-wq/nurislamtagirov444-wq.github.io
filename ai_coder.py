import sys
import g4f

def ask_ai(prompt):
    print(f"🤖 Думаю над задачей: {prompt}...\n")
    try:
        response = g4f.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Ты ИИ-помощник программиста. Твоя задача — писать качественный, чистый код и помогать с разработкой."},
                {"role": "user", "content": prompt}
            ],
            stream=True
        )
        print("💡 Ответ:")
        for message in response:
            print(message, end="", flush=True)
        print("\n")
    except Exception as e:
        print(f"❌ Ошибка соединения: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        ask_ai(" ".join(sys.argv[1:]))
    else:
        print("Использование: python ai_coder.py \"Ваш вопрос или задача\"")
