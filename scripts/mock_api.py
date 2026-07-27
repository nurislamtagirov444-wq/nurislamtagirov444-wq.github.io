from fastapi import FastAPI
import random

app = FastAPI(title="AI Mock Server")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Это тестовый сервер для Android приложения"}

@app.get("/api/v1/stats")
def get_fake_stats():
    return {
        "most_used_app": random.choice(["YouTube", "TikTok", "Instagram", "GitHub"]),
        "usage_minutes": random.randint(30, 300),
        "ai_recommendation": "Попробуйте отложить телефон и прогуляться!"
    }
