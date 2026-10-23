"""
PashuRakshak - Weather Service (OpenWeatherMap + Simulation Fallback)
"""

import os
import math
import requests

weather_cache = {}

def get_weather(lat: float = 30.9010, lng: float = 75.8572) -> dict:
    cache_key = f"{round(lat, 2)},{round(lng, 2)}"
    if cache_key in weather_cache:
        return weather_cache[cache_key]

    api_key = os.getenv("OPENWEATHER_API_KEY")
    if api_key:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={api_key}&units=metric"
            resp = requests.get(url, timeout=3)
            if resp.status_code == 200:
                d = resp.json()
                result = {
                    "temp": round(d["main"]["temp"]),
                    "humidity": d["main"]["humidity"],
                    "wind_speed": round(d["wind"]["speed"] * 3.6),
                    "description": d["weather"][0]["description"],
                    "city": d.get("name", "Ludhiana Region"),
                    "is_mock": False
                }
                weather_cache[cache_key] = result
                return result
        except Exception:
            pass

    # Deterministic Punjab climate simulation
    lat_offset = math.sin(lat * 10) * 2
    lng_offset = math.cos(lng * 10) * 3
    temp = round(32 + lat_offset)
    humidity = min(85, max(45, round(58 + lng_offset * 2)))
    wind = round(11 + abs(lat_offset) * 2)

    result = {
        "temp": temp,
        "humidity": humidity,
        "wind_speed": wind,
        "description": "clear sky",
        "city": "Ludhiana District",
        "is_mock": True
    }
    weather_cache[cache_key] = result
    return result
