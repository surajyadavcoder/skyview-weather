# SkyView — Weather App

I built this because every weather app I used either overwhelmed me with data or gave me nothing useful. Wanted something that actually helps you decide things — not just shows numbers.

The AI chat came from a frustration I had. I'd check the weather, see "40% chance of rain" and still not know whether to carry an umbrella. So I built a chat where you just ask — "should I carry an umbrella?" or "good day for a run?" — and it tells you directly based on your local forecast.

## What it does

Opens with your live location. No city selection, no setup — just your weather. You can search any city with autocomplete if needed.

The AI chat is the main thing that makes this different. Ask it anything practical — whether to bike to work, wear a jacket, or take a flight. It reads the actual forecast numbers and gives you a straight answer.

Beyond that: current conditions with humidity, wind, visibility and pressure. A 7-day forecast. Hourly breakdown for the next 24 hours. Background changes based on weather condition and time of day. Dark and light mode. Celsius and Fahrenheit toggle. Auto-refreshes every 5 minutes.

## Tech used

Next.js 14 with TypeScript. OpenWeatherMap API for current weather, forecast, and city search with geocoding. Groq (Llama 3.3 70B) for the AI chat and alert generation. Browser Geolocation API for live location detection.

## Live Demo

https://skyview-weather-cwb3.vercel.app

## Run it locally

You need two API keys — OpenWeatherMap and Groq, both free.

```bash
git clone https://github.com/surajyadavcoder/skyview-weather
cd skyview-weather
npm install
cp .env.example .env.local
```

Add your keys to .env.local:

```
OPENWEATHER_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

```bash
npm run dev
```

Open http://localhost:3000

## Author

Suraj Yadav
LinkedIn: https://linkedin.com/in/iamsurajyadav
GitHub: https://github.com/surajyadavcoder
