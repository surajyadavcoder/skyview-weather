# SkyView — Real-Time Weather App

A weather application I built to practice working with external APIs, geolocation, and real-time data. It detects your location automatically and shows current conditions along with a 7-day forecast.

## Live Demo

Add your deployment link here.

## What it does

- Detects your live location automatically on page load
- Shows current temperature, humidity, wind speed, visibility, and pressure
- 7-day forecast with high/low temperatures and rain probability
- Hourly forecast for the next 24 hours
- City search with autocomplete suggestions
- Background changes based on weather condition and time of day
- Toggle between Celsius and Fahrenheit
- Auto-refreshes every 5 minutes

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- OpenWeatherMap API (current weather + forecast + geocoding)
- Browser Geolocation API
- Tailwind CSS with custom glassmorphism UI

## Run Locally

1. Clone the repo

git clone https://github.com/your-username/skyview-weather
cd skyview-weather

2. Install dependencies

npm install

3. Create .env.local file

cp .env.example .env.local

Add your OpenWeatherMap API key:
OPENWEATHER_API_KEY=your_key_here

4. Start the app

npm run dev

Open http://localhost:3000

## Author

Suraj Yadav
LinkedIn: https://linkedin.com/in/iamsurajyadav
GitHub: https://github.com/surajyadavcoder
