import os
import json
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
from app.chain import get_travel_response, stream_travel_response

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

@app.post("/chat")
async def chat(request: ChatRequest):
    response = get_travel_response(request.message, request.session_id)
    return {"response": response}

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    def generate():
        for chunk in stream_travel_response(request.message, request.session_id):
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: \"[DONE]\"\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/weather/{city}")
async def get_weather(city: str):
    if not WEATHER_API_KEY:
        return {"error": "날씨 API 키가 설정되지 않았습니다."}
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"q": city, "appid": WEATHER_API_KEY, "units": "metric", "lang": "kr"}
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            return {
                "city": data["name"],
                "temp": round(data["main"]["temp"]),
                "feels_like": round(data["main"]["feels_like"]),
                "description": data["weather"][0]["description"],
                "humidity": data["main"]["humidity"],
                "icon": data["weather"][0]["icon"],
            }
        return {"error": "날씨 정보를 가져올 수 없습니다."}
    except Exception:
        return {"error": "날씨 서비스 오류"}

@app.get("/health")
async def health():
    return {"status": "ok"}
