const fetch = require("node-fetch");

async function getWeather(req, res) {
    try {
        const url =
            "https://api.open-meteo.com/v1/forecast?latitude=30.6&longitude=-96.3&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit";

        const response = await fetch(url);
        const data = await response.json();

        const current = data.current;

        res.json({
            temperature: current.temperature_2m,
            weatherCode: current.weather_code,
            isDay: current.is_day
        });
    } catch (err) {
        console.error("Weather API error:", err);
        res.status(500).json({ error: "Unable to fetch weather" });
    }
}

module.exports = { getWeather };
