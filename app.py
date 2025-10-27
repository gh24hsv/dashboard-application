import requests
from flask import Flask, render_template, jsonify, request
from datetime import datetime

app = Flask(__name__)

@app.route("/")
def dashboard():
    return render_template("dashboard.html")

# ✅ Updated Open-Meteo API version
@app.route("/api/weather")
def api_weather():
    # Default coordinates — Chennai
    city = request.args.get("city", "Chennai").lower()
    coords = {
        "chennai": (13.08, 80.27),
        "delhi": (28.61, 77.20),
        "mumbai": (19.07, 72.87),
        "berlin": (52.52, 13.41),
        "new york": (40.71, -74.00),
        "tokyo": (35.68, 139.69)
    }
    lat, lon = coords.get(city, (13.08, 80.27))

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,wind_speed_10m,relative_humidity_2m"
        "&timezone=auto"
    )

    try:
        res = requests.get(url, timeout=5)
        data = res.json()
        current = data.get("current", {})
        return jsonify({
            "city": city.title(),
            "temp": round(current.get("temperature_2m", 0), 1),
            "humidity": current.get("relative_humidity_2m", 0),
            "wind_speed": current.get("wind_speed_10m", 0),
            "time": current.get("time"),
            "lat": lat,
            "lon": lon,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quote")
def api_quote():
    try:
        res = requests.get("https://quotes-api-self.vercel.app/quote", timeout=5)
        data = res.json()

        # Normalize keys to match your frontend expectation
        return jsonify({
            "content": data.get("quote", "Be the change you wish to see in the world."),
            "author": data.get("author", "Unknown")
        })
    except Exception as e:
        # graceful fallback
        return jsonify({
            "content": "Be the change you wish to see in the world.",
            "author": "Mahatma Gandhi"
        })


@app.route("/api/time")
def api_time():
    now = datetime.now()
    return jsonify({
        "iso": now.isoformat(),
        "hour": now.hour,
        "minute": now.minute,
        "second": now.second
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)