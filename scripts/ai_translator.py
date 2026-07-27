import g4f
import sys

def translate_app_strings(target_language="Английский"):
    # Пример: Берем строковые ресурсы приложения
    sample_text = """
    <resources>
        <string name="app_name">Аниме Новелла</string>
        <string name="scene_1_text">Привет! Ты наконец-то проснулся. Мы опаздываем в магическую академию!</string>
        <string name="scene_2_text">Отлично, бежим! Сегодня распределение по магическим гильдиям.</string>
    </resources>
    """
    
    print(f"🌍 ИИ переводит ресурсы приложения на {target_language}...\n")
    prompt = f"Ты профессиональный локализатор игр. Переведи следующий XML файл на {target_language}. Сохрани все XML теги в точности, переведи только текст внутри тегов.\n\n{sample_text}"
    
    try:
        response = g4f.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        print("💡 [Результат перевода]:\n")
        print(response)
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    lang = sys.argv[1] if len(sys.argv) > 1 else "Японский"
    translate_app_strings(lang)
