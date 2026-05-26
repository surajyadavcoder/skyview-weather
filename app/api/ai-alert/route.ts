import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { weather, forecast } = await req.json();

    if (!weather || !forecast) {
      return NextResponse.json({ error: 'Weather data required' }, { status: 400 });
    }

    const next24h = forecast.list.slice(0, 8);
    const next48h = forecast.list.slice(0, 16);
    const rainChance = Math.max(...next24h.map((f: any) => f.pop * 100));
    const minTemp = Math.min(...next48h.map((f: any) => f.main.temp_min));
    const maxTemp = Math.max(...next48h.map((f: any) => f.main.temp_max));
    const maxWind = Math.max(...next24h.map((f: any) => f.wind.speed * 3.6));

    const prompt = `You are a friendly local weather advisor. Based on this weather data, give 2-3 short, practical, conversational alerts in English. Sound like a helpful friend, not a robot.

Current weather in ${weather.name}:
- Temperature: ${Math.round(weather.main.temp)}°C, feels like ${Math.round(weather.main.feels_like)}°C
- Condition: ${weather.weather[0].description}
- Humidity: ${weather.main.humidity}%
- Wind: ${Math.round(weather.wind.speed * 3.6)} km/h

Next 24 hours:
- Rain probability: ${Math.round(rainChance)}%
- Temperature range: ${Math.round(minTemp)}°C to ${Math.round(maxTemp)}°C
- Max wind speed: ${Math.round(maxWind)} km/h

Rules:
- Give exactly 2-3 alerts
- Each alert must start with a relevant emoji
- Be specific and actionable
- Keep each alert under 20 words
- Sound natural and conversational
- Return as JSON array: [{"icon": "emoji", "message": "alert text", "severity": "info|warning|danger"}]
- Return ONLY the JSON array, nothing else`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 400,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '[]';

    let alerts = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) alerts = JSON.parse(jsonMatch[0]);
    } catch {
      alerts = [{ icon: '🌤️', message: 'Weather looks fine today. Stay updated!', severity: 'info' }];
    }

    return NextResponse.json({ alerts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
